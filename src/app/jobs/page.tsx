'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Jobs from '@/components/jobs/Jobs';
import { JobFilters, JobFilters as JobFiltersType } from '@/components/jobs/filter/JobFilters';
import { filterJobs } from '@/components/jobs/filter/jobFilterUtils';
import { CreateJobForm } from '@/components/jobs/CreateJobForm';

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFiltersType>({});

  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });

  // Apply filters to jobs
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];
    return filterJobs(data.jobs, filters);
  }, [data?.jobs, filters]);

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div/>
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block flex-1" />
        <div className="flex-1 order-2 md:order-1 p-4 container mx-auto overflow-y-auto">
          <JobFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
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
          {filteredJobs.length > 0 ? (
            <div className="space-y-6">
              {filteredJobs.map((job: any) => (
                <Jobs key={job.id} job={job} />
              ))}
            </div>
          ) : (
            !isLoading && <div className="text-gray-600 text-center">No jobs found.</div>
          )}
        </div>
        <div className="flex-1 order-1 md:order-2 p-4 container mx-auto overflow-y-auto">
          {/* passing empty function since logic is dealt with inside the component itself */}
          <CreateJobForm onSubmit={async () => {}} />
        </div>
      </div>
    </div>
  );
}