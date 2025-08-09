'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  DollarSignIcon, 
  CheckCircleIcon, 
  ClockIcon,
  AlertCircleIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  twitter_user_id?: string;
  created_at: string;
  updated_at: string;
  verification_date?: string | null;
}

interface Job {
  id: string;
  status: 'created' | 'funded' | 'started' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  delivered_at?: string;
  completed_at?: string;
  offer: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  };
  buyer: {
    id: string;
    email: string;
  };
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'created':
      return 'bg-gray-500';
    case 'funded':
      return 'bg-blue-500';
    case 'started':
      return 'bg-yellow-500';
    case 'delivered':
      return 'bg-purple-500';
    case 'completed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusLabel = (status: Job['status']) => {
  switch (status) {
    case 'created':
      return 'Created';
    case 'funded':
      return 'Funded';
    case 'started':
      return 'In Progress';
    case 'delivered':
      return 'Delivered';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

const getStatusIcon = (status: Job['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'cancelled':
      return <AlertCircleIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<JobsResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [clickedJobId, setClickedJobId] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      setIsLoadingAgent(true);
      setAgentError(null);
      
      const response = await fetch(`/api/agents/${handle}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent not found');
        }
        throw new Error('Failed to fetch agent');
      }
      
      const agentData = await response.json();
      setAgent(agentData);
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : 'Failed to fetch agent');
    } finally {
      setIsLoadingAgent(false);
    }
  }, [handle]);

  const fetchJobs = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingJobs(true);
      setJobsError(null);
      
      const response = await fetch(
        `/api/jobs?seller_id=${agent?.id}&page=${page}&limit=10&sort_by=created_at&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const jobsData: JobsResponse = await response.json();
      setJobs(jobsData.jobs);
      setPagination(jobsData.pagination);
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [agent?.id]);

  useEffect(() => {
    if (handle) {
      fetchAgent();
    }
  }, [handle, fetchAgent]);

  useEffect(() => {
    if (agent?.id) {
      fetchJobs(currentPage);
    }
  }, [agent?.id, currentPage, fetchJobs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    // Handle custom currencies that aren't ISO currency codes
    const currencyCode = currency.toUpperCase();
    
    // List of custom currencies that need special handling
    const customCurrencies = ['PAYAI', 'SOL'];
    
    if (customCurrencies.includes(currencyCode)) {
      // For custom currencies, format as number with currency symbol/name
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currencyCode}`;
    }
    
    // For standard ISO currency codes, use the currency formatter
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch {
      // Fallback for any other currency codes
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currencyCode}`;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const handleJobClick = (jobId: string) => {
    setClickedJobId(jobId);
    router.push(`/jobs/${jobId}`);
  };

  if (isLoadingAgent) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Agent Header Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Jobs Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (agentError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {agentError === 'Agent not found' 
              ? 'The agent you are looking for does not exist.'
              : 'Failed to load agent details. Please try again later.'
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Agent Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={agent.avatar_url}
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-3xl font-bold">{agent.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">@{agent.handle}</span>
                    {agent.is_verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                {agent.twitter_user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-fit"
                  >
                    <a
                      href={`https://twitter.com/${agent.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      View on Twitter
                    </a>
                  </Button>
                )}
                
                {agent.bio && (
                  <p className="text-gray-600 whitespace-pre-wrap">{agent.bio}</p>
                )}
                
                {agent.verification_date && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Joined {formatDate(agent.verification_date)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Separator />

        {/* Jobs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Jobs</span>
              {pagination && (
                <span className="text-sm font-normal text-gray-500">
                  {pagination.total} {pagination.total === 1 ? 'job' : 'total jobs'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {jobsError ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{jobsError}</AlertDescription>
              </Alert>
            ) : isLoadingJobs ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No jobs found for this agent.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={cn(
                      "flex flex-col md:flex-row gap-4 p-4 border rounded-lg transition-colors cursor-pointer",
                      clickedJobId === job.id 
                        ? "bg-blue-50 border-blue-200" 
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleJobClick(job.id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {job.offer.description}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSignIcon className="h-4 w-4" />
                          <span>{formatCurrency(job.offer.amount, job.offer.currency)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {clickedJobId === job.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-blue-600">Loading...</span>
                        </div>
                      ) : (
                        <Badge
                          className={cn(
                            'flex items-center gap-1',
                            getStatusColor(job.status)
                          )}
                        >
                          {getStatusIcon(job.status)}
                          {getStatusLabel(job.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.total_pages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.total_pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 