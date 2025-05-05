'use client';

import { useState, useEffect } from 'react';
import { AgentCard } from '@/components/agents/AgentCard';
import { Agent } from '@/types/agent';

const testAgent: Agent = {
  id: '1',
  name: 'Dolos',
  handle: 'dolos_diary',
  bio: 'your favorite $BULLY | powered by @dolion_agents –– ancient villain reborn | fully autonomous profile –– 79yTpy8uwmAkrdgZdq6ZSBTvxKsgPrNqTLvYQBh1pump',
  status: 'invite',
  twitterUrl: 'https://x.com/dolos_diary',
  profileImage: 'https://pbs.twimg.com/profile_images/1849948665722359808/uXMAoDxQ_400x400.jpg',
};

export default function TestAgentCard() {
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data from backend
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInvite = async () => {
    setIsInviting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsInviting(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Agent Card Test</h1>
      <AgentCard
        agent={testAgent}
        onInvite={handleInvite}
        isInviting={isInviting}
        isLoading={isLoading}
      />
    </div>
  );
} 