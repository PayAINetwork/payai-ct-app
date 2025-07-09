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

    // change environment variable name for this
    // 3. Agent token value validation
    if (rawToken != process.env.NEXT_PUBLIC_VERIFICATION_AGENT){
        return NextResponse.json({ error: 'Incorrect api token.'}, {status: 401})
    }
    
    // create supabase connection
    const supabase = createServiceRoleSupabaseClient();
    
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
    if (job.status !== 'created') {
      return NextResponse.json({ error: 'Job is not in created state.' }, { status: 400 });
    }

    // 6. Update the job status to started
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
