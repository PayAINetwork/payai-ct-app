export type AgentStatus = 'live' | 'invite';

export interface Agent {
  id: string;
  name: string;
  handle: string; // Twitter handle without @ symbol
  bio: string;
  profileImage?: string;
  status: AgentStatus;
  twitterUrl: string;
} 