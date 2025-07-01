import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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

interface JobsProps {
    job: Job;
}

const Jobs = ({ job }: JobsProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        setLoading(true);
        router.push(`/jobs/${job.id}`);
    };

    return (
        <div className="relative">
            <Card
                key={job.id}
                className={`w-full max-w-2xl mx-auto cursor-pointer transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={handleClick}
            >
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
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            )}
        </div>
    );
}

export default Jobs;