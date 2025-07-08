import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashToken } from '@/lib/auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

// Validate job id param
const paramsSchema = z.object({
  id: z.string().min(1).refine((val) => /^\d+$/.test(val), {
    message: 'Invalid job ID',
  }),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate job ID
    const params = await context.params;
    const { id } = paramsSchema.parse(params);

    // 2. Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    const rawToken = authHeader.split(' ')[1];

    const hashedToken = await hashToken(rawToken);

    const supabase = createServiceRoleSupabaseClient();

    // 3. Look up the token in access_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('access_tokens')
      .select('user_id, token_hash, expires_at, revoked_at')
      .eq('token_hash', hashedToken)
      .single();
      console.log(tokenData)
    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const now = new Date();
    if (new Date(tokenData.expires_at) < now || tokenData.revoked_at) {
      return NextResponse.json({ error: 'Token expired or revoked' }, { status: 401 });
    }

    // 4. Fetch the agent for this user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('user_id', tokenData.user_id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found for this token' }, { status: 403 });
    }

    // 5. Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log("Job status is: " + job.status)

    // 6. Check job status and agent assignment
    if (job.status !== 'funded') {
      return NextResponse.json({ error: 'Job is not in funded state' }, { status: 400 });
    }
    if (job.seller_id !== agent.id) {
      return NextResponse.json({ error: 'Agent is not assigned to this job' }, { status: 403 });
    }

    // 7. Update the job status to started
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'started',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError || !updatedJob) {
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error('Error in PUT /api/jobs/[id]/start:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
