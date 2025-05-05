import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentCardProps {
  agent: Agent;
  onInvite?: () => Promise<void>;
  isInviting?: boolean;
  isLoading?: boolean;
}

export function AgentCard({ agent, onInvite, isInviting, isLoading = false }: AgentCardProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  
  const getStatusColor = (status: Agent['status']) => {
    return status === 'live' ? 'bg-green-500' : 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-[200px] w-[200px]">
          <AvatarImage
            src={agent.profileImage}
            alt={agent.name}
            className="object-cover"
          />
          <AvatarFallback className="text-4xl">
            {getInitials(agent.handle)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">{agent.name}</h2>
            <Link
              href={agent.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              @{agent.handle}
            </Link>
          </div>
          <Badge
            className={cn(
              'w-fit',
              getStatusColor(agent.status)
            )}
          >
            {agent.status === 'live' ? 'Live' : 'Needs Onboarding'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 break-words whitespace-pre-wrap">
          {agent.bio}
        </p>
        {agent.status === 'invite' && (
          <Button
            className="w-full mt-4"
            onClick={onInvite}
            disabled={isInviting}
          >
            {isInviting ? 'Sending Invite...' : 'Invite & Onboard'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 