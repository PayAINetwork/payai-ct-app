'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { DeliverySection } from '@/components/delivery/DeliverySection';
import AccordionSection, { SectionItem } from '@/components/AccordionSection';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Payment } from '@/components/payment/Payment';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Status enum
enum JobStatus {
  Created = 'created',
  Funded = 'funded',
  Started = 'started',
  Delivered = 'delivered',
  Completed = 'completed',
}

// Mapping of status enum to display string
const statusDisplayMap: Record<JobStatus, string> = {
  [JobStatus.Created]: 'Created',
  [JobStatus.Funded]: 'Funded',
  [JobStatus.Started]: 'Started',
  [JobStatus.Delivered]: 'Delivered',
  [JobStatus.Completed]: 'Complete',
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;
  console.log('params', params);
  console.log('jobId', jobId);

  const { data: jobData, isLoading: isLoadingJob, error: errorJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Failed to fetch job');
      return res.json();
    },
    enabled: !!jobId,
  });

  if (isLoadingJob) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-40 w-full mb-4" />
        </div>
      </div>
    );
  }

  if (errorJob || !jobData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4">
          <div className="text-red-600">Error loading job: {errorJob?.message || 'Not found'}</div>
        </div>
      </div>
    );
  }

  const job = jobData;
  console.log('job', job);

  const status = job.status as JobStatus;
  const statusTimestamps = {
    [JobStatus.Created]: job.created_at,
    [JobStatus.Funded]: job.funded_at || '',
    [JobStatus.Started]: job.started_at || '',
    [JobStatus.Delivered]: job.delivered_at || '',
    [JobStatus.Completed]: job.completed_at || '',
  };

  const allSections: SectionItem[] = [
    {
      key: 'Order Description',
      title: 'Order Details',
      summary: (
        <div className="space-y-1">
          <div>{job.buyer?.name} hiring {job.seller?.name}</div>
          <div className="text-xs text-gray-500">
            Created at {new Date(job.created_at).toLocaleString()}
          </div>
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <div className="text-lg font-light">
            {job.buyer?.name} is hiring {job.seller?.name}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a 
                href={`https://x.com/${job.buyer?.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Avatar>
                  <AvatarImage src={job.buyer?.avatar_url} alt={job.buyer?.name} />
                  <AvatarFallback>{job.buyer?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </a>
              <div className="flex flex-col">
                <span className="font-medium">{job.buyer?.name}</span>
                <span className="text-sm text-muted-foreground">@{job.buyer?.handle}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href={`https://x.com/${job.seller?.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Avatar>
                  <AvatarImage src={job.seller?.avatar_url} alt={job.seller?.name || 'Agent'} />
                  <AvatarFallback>{job.seller?.name?.slice(0, 2).toUpperCase() || 'AG'}</AvatarFallback>
                </Avatar>
              </a>
              <div className="flex flex-col">
                <span className="font-medium">{job.seller?.name || 'Agent'}</span>
                <span className="text-sm text-muted-foreground">@{job.seller?.handle}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <blockquote className="mt-2 border-l-2 border-muted pl-4 italic text-muted-foreground">
              {job.offer?.description}
            </blockquote>
          </div>

          {job.offer?.post_url && (
            <a 
              href={job.offer?.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              View on X
            </a>
          )}
        </div>
      )
    },
    {
      key: JobStatus.Created,
      title: 'Payment',
      summary: (
        <div className="space-y-1">
          <div>{status === JobStatus.Created ? 'Awaiting Payment' : statusDisplayMap[status]}</div>
          {status !== JobStatus.Created && (
            <div className="text-xs text-gray-500">
              Funded at {statusTimestamps[JobStatus.Funded] && new Date(statusTimestamps[JobStatus.Funded]).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <Payment 
            amountSol={job.offer?.amount || 0}
            amountPayai={job.offer?.amount || 0}
            escrowAddress={job.offer?.escrow_address || ''}
          />
        </div>
      )
    },
    {
      key: JobStatus.Funded,
      title: 'Awaiting Agent',
      summary: (
        <div className="space-y-1">
          <div>{job.seller?.name} - {statusDisplayMap[status]}</div>
          {[JobStatus.Started,JobStatus.Delivered,JobStatus.Completed].includes(status) && (
            <div className="text-xs text-gray-500">
              Agent accepted at {statusTimestamps[JobStatus.Started] && new Date(statusTimestamps[JobStatus.Started]).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: <Button onClick={() => {}}>Notify Agent</Button>
    },
    {
      key: JobStatus.Started,
      title: 'Job In Progress',
      summary: (
        <div className="text-sm text-gray-600">
          Started at {statusTimestamps[JobStatus.Started] && new Date(statusTimestamps[JobStatus.Started]).toLocaleString()}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <StatusTimeline
            currentStatus={status}
            statusTimestamps={statusTimestamps}
          />
          <Button onClick={() => {}}>Mark as Started</Button>
        </div>
      )
    },
    {
      key: JobStatus.Delivered,
      title: 'Work Delivered',
      summary: (
        <div className="space-y-1">
          <a href={'#'} target="_blank" rel="noopener noreferrer" className="underline">
            Deliverable Link
          </a>
          {[JobStatus.Delivered,JobStatus.Completed].includes(status) && (
            <div className="text-xs text-gray-500">
              Delivered at {statusTimestamps[JobStatus.Delivered] && new Date(statusTimestamps[JobStatus.Delivered]).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <DeliverySection
            deliverableUrl={'#'}
            shareOptions={{ title: 'Deliverable Link', text: 'View your deliverable here' }}
          />
          <Button onClick={() => {}}>Confirm Delivery</Button>
        </div>
      )
    },
    {
      key: JobStatus.Completed,
      title: 'Job Complete',
      summary: (
        <div className="text-sm text-gray-600">
          Completed at {statusTimestamps[JobStatus.Completed] && new Date(statusTimestamps[JobStatus.Completed]).toLocaleString()}
        </div>
      ),
      detail: <p>Thank you! The job is complete.</p>
    }
  ];

  const visibleSections = allSections.filter(section => 
    [
      JobStatus.Created,
      JobStatus.Funded,
      JobStatus.Started,
      JobStatus.Delivered,
      JobStatus.Completed,
      'Order Description',
    ].includes(section.key as any)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4">
        <AccordionSection sections={visibleSections} currentState={status} />
      </div>
    </div>
  );
} 



