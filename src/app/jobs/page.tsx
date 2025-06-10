'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


export default function JobsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Job Listings</h1>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="w-full max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {error && (
          <div className="text-red-600">Error loading jobs: {error.message}</div>
        )}
        {data && data.jobs && data.jobs.length > 0 ? (
          <div className="space-y-6">
            {data.jobs.map((job: any) => (
              <Card key={job.id} className="w-full max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={job.seller?.profile_image_url} alt={job.seller?.name} />
                    <AvatarFallback>{job.seller?.name?.slice(0, 2).toUpperCase() || 'AG'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{job.seller?.name || 'Agent'}</span>
                    <span className="text-sm text-muted-foreground">@{job.seller?.handle}</span>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 rounded bg-gray-200 text-xs font-medium">
                      {job.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-lg font-medium">{job.offer?.description}</div>
                  <div className="text-sm text-gray-600">
                    Amount: {job.offer?.amount} {job.offer?.currency}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Created: {new Date(job.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && <div className="text-gray-600 text-center">No jobs found.</div>
        )}
      </div>
    </div>
  );
} 