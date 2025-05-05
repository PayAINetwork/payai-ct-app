'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agents/AgentCard';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { useQuery } from '@tanstack/react-query';

// Temporary mock data - replace with actual API call
const mockAgent = {
  id: '1',
  name: 'Dolos',
  handle: 'dolos_diary',
  profileImage: 'https://pbs.twimg.com/profile_images/1849948665722359808/uXMAoDxQ_400x400.jpg',  
  twitterUrl: 'https://x.com/dolos_diary',
  status: 'live' as const,
  bio: 'your favorite $BULLY | powered by @dolion_agents –– ancient villain reborn | fully autonomous profile –– 79yTpy8uwmAkrdgZdq6ZSBTvxKsgPrNqTLvYQBh1pump',
};

export default function PaymentLinkPage() {
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return mockAgent;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1">
              <AgentCard 
                agent={agent} 
                isLoading={isLoading}
                variant="header" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <section>
            <PricingToggle />
          </section>
          
          {/* Placeholder for other sections */}
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Escrow Details</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Status Timeline</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </section>
        </div>
      </main>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 md:hidden">
        <Button className="w-full" size="lg">
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
} 