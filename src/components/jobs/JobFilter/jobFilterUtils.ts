import { JobFilters } from './JobFilters';

interface Job {
  id: string;
  status: string;
  created_at: string;
  seller?: {
    name?: string;
    handle?: string;
    profile_image_url?: string;
  };
  offer?: {
    description?: string;
    amount?: number;
    currency?: string;
  };
}

export const filterJobs = (jobs: Job[], filters: JobFilters): Job[] => {
  return jobs.filter(job => {
    // Filter by agent name
    if (filters.agentName && job.seller?.name) {
      const jobName = job.seller.name.toLowerCase();
      const filterName = filters.agentName.toLowerCase();
      if (!jobName.includes(filterName)) {
        return false;
      }
    }

    // Filter by agent handle
    if (filters.agentHandle && job.seller?.handle) {
      const jobHandle = job.seller.handle.toLowerCase();
      const filterHandle = filters.agentHandle.toLowerCase();
      if (!jobHandle.includes(filterHandle)) {
        return false;
      }
    }

    // Filter by status
    if (filters.status && job.status !== filters.status) {
      return false;
    }

    // Filter by amount range
    if (filters.minAmount && job.offer?.amount) {
      if (job.offer.amount < filters.minAmount) {
        return false;
      }
    }

    if (filters.maxAmount && job.offer?.amount) {
      if (job.offer.amount > filters.maxAmount) {
        return false;
      }
    }

    // Filter by currency
    if (filters.currency && job.offer?.currency) {
      if (job.offer.currency !== filters.currency) {
        return false;
      }
    }

    return true;
  });
}; 