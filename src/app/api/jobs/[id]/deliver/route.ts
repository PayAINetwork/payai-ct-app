import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUserOrError } from '@/lib/auth';

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

    // 2. Get authenticated user via middleware or Supabase session
    const { user, error } = await getAuthenticatedUserOrError(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleSupabaseClient();

    // 3. Fetch the agent for this user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found for this user' }, { status: 403 });
    }

    // 4. Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 5. Check job status and agent assignment
    if (job.status !== 'started') {
      return NextResponse.json({ error: 'Job is not in started state' }, { status: 400 });
    }
    if (job.seller_id !== agent.id) {
      return NextResponse.json({ error: 'Agent is not assigned to this job' }, { status: 403 });
    }

    // 6. Update the job status to delivered
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'delivered',
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
    console.error('Error in PUT /api/jobs/[id]/deliver:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
