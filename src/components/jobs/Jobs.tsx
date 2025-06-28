import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    return (
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
    );
}

export default Jobs;