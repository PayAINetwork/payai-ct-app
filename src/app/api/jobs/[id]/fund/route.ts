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

    // 2. Authenticate and authorize privileged user via middleware-injected user
    const { user, error } = await getAuthenticatedUserOrError(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privilegedUserId = process.env.VERIFICATION_AGENT;
    if (!privilegedUserId) {
      return NextResponse.json({ error: 'Verification agent not configured' }, { status: 500 });
    }
    if (user.id !== privilegedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // create supabase connection
    const supabase = createServiceRoleSupabaseClient();
    
    // 3. Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 4. Check job status
    if (job.status !== 'created') {
      return NextResponse.json({ error: 'Job is not in created state.' }, { status: 400 });
    }

    // 5. Update the job status to funded
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'funded',
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
    console.error('Error in PUT /api/jobs/[id]/funded:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
