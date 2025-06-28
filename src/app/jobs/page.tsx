'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Jobs from '@/components/jobs/Jobs';


export default function JobsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      console.log(data);
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
        {/* Removed this for better clarity for the user and to declutter space. */}
        {/* {error && (
          <div className="text-red-600">Error loading jobs: {error.message}</div>
        )} */}
        {data && data.jobs && data.jobs.length > 0 ? (
          <div className="space-y-6">
            {data.jobs.map((job: any) => (
              <Jobs job={job} />
            ))}
          </div>
        ) : (
          !isLoading && <div className="text-gray-600 text-center">No jobs found.</div>
        )}
      </div>
    </div>
  );
} 