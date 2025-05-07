'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatusTimeline, TimelineStatus } from '@/components/timeline/StatusTimeline';
import { DeliverySection } from '@/components/delivery/DeliverySection';
import AccordionSection, { SectionItem } from '@/components/AccordionSection';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Payment } from '@/components/payment/Payment';
import { Button } from '@/components/ui/button';

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

// Temporary mock data with timestamps for each status
const mockPaymentLink = {
  id: '1',
  userSpecifiedAmount: 1000,
  userSpecifiedCurrency: 'PAYAI',
  amountSol: 0.002712,
  amountPayai: 1000,
  status: 'Unfunded' as TimelineStatus,
  escrowAddress: 'w83QLKPfNrD5kcPeXxroi8wHgS7ENnUdHU5WJHcuPHa',
  buyerXName: 'Notorious D.E.V',
  buyerXHandle: 'notorious_d_e_v',
  buyerRequest: 'Hey @dolos_diary, I want you to write a birthday tweet for my friend. Make it sting.',
  buyerXStatusId: '1919956460995223634',
  buyerXProfileImage: 'https://pbs.twimg.com/profile_images/1894573079327567872/foVOWapl_400x400.jpg',
  statusTimestamps: {
    Unfunded: '2023-07-01T12:00:00Z',
    Funded: '2023-07-02T15:30:00Z',
    Started: '',
    Delivered: '',
    Complete: ''
  }
};

// Mock deliverable data
const mockDelivery = {
  deliverableUrl: 'https://example.com/delivery/1',
  shareOptions: {
    title: 'Deliverable Link',
    text: 'View your deliverable here',
  },
};

// Map status to visible section keys
const statusToVisibleSections: Record<TimelineStatus, string[]> = {
  Unfunded: ['Order Description', 'Unfunded'],
  Funded: ['Order Description', 'Unfunded', 'Funded'],
  Started: ['Order Description', 'Unfunded', 'Funded', 'Started'],
  Delivered: ['Order Description', 'Unfunded', 'Funded', 'Started', 'Delivered'],
  Complete: ['Order Description', 'Unfunded', 'Funded', 'Started', 'Delivered', 'Complete']
};

export default function PaymentLinkPage() {
  const { data: agent } = useQuery({
    queryKey: ['agent'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return mockAgent;
    }
  });

  // Action handlers for accordion
  const handleNotifyAgent = () => console.log('Notify Agent clicked');
  const handleMarkStarted = () => console.log('Mark as Started clicked');
  const handleConfirmDelivery = () => console.log('Confirm Delivery clicked');

  // Accordion sections configuration
  const allSections: SectionItem[] = [
    {
      key: 'Order Description',
      title: 'Order Details',
      summary: (
        <div className="space-y-1">
          <div>{mockPaymentLink.buyerXName} hiring {agent?.name}</div>
          <div className="text-xs text-gray-500">
            Created at {new Date(mockPaymentLink.statusTimestamps.Unfunded).toLocaleString()}
          </div>
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <div className="text-lg font-light">
            {mockPaymentLink.buyerXName} is hiring {agent?.name}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a 
                href={`https://x.com/${mockPaymentLink.buyerXHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Avatar>
                  <AvatarImage src={mockPaymentLink.buyerXProfileImage} alt={mockPaymentLink.buyerXName} />
                  <AvatarFallback>{mockPaymentLink.buyerXName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </a>
              <div className="flex flex-col">
                <span className="font-medium">{mockPaymentLink.buyerXName}</span>
                <span className="text-sm text-muted-foreground">@{mockPaymentLink.buyerXHandle}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href={`https://x.com/${agent?.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Avatar>
                  <AvatarImage src={agent?.profileImage} alt={agent?.name || 'Agent'} />
                  <AvatarFallback>{agent?.name?.slice(0, 2).toUpperCase() || 'AG'}</AvatarFallback>
                </Avatar>
              </a>
              <div className="flex flex-col">
                <span className="font-medium">{agent?.name || 'Agent'}</span>
                <span className="text-sm text-muted-foreground">@{agent?.handle}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <blockquote className="mt-2 border-l-2 border-muted pl-4 italic text-muted-foreground">
              {mockPaymentLink.buyerRequest}
            </blockquote>
          </div>

          <a 
            href={`https://x.com/${mockPaymentLink.buyerXHandle}/status/${mockPaymentLink.buyerXStatusId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View on X
          </a>
        </div>
      )
    },
    {
      key: 'Unfunded',
      title: 'Payment',
      summary: (
        <div className="space-y-1">
          <div>{mockPaymentLink.status === 'Unfunded' ? 'Awaiting Payment' : mockPaymentLink.status}</div>
          {mockPaymentLink.status !== 'Unfunded' && (
            <div className="text-xs text-gray-500">
              Funded at {new Date(mockPaymentLink.statusTimestamps.Funded).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <Payment 
            amountSol={mockPaymentLink.amountSol}
            amountPayai={mockPaymentLink.amountPayai}
            escrowAddress={mockPaymentLink.escrowAddress}
          />
        </div>
      )
    },
    {
      key: 'Funded',
      title: 'Awaiting Agent',
      summary: (
        <div className="space-y-1">
          <div>{agent?.name} - {agent?.status}</div>
          {['Started','Delivered','Complete'].includes(mockPaymentLink.status) && (
            <div className="text-xs text-gray-500">
              Agent accepted at {new Date(mockPaymentLink.statusTimestamps.Started).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: <Button onClick={handleNotifyAgent}>Notify Agent</Button>
    },
    {
      key: 'Started',
      title: 'Job In Progress',
      summary: (
        <div className="text-sm text-gray-600">
          Started at {new Date(mockPaymentLink.statusTimestamps.Started).toLocaleString()}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <StatusTimeline
            currentStatus={mockPaymentLink.status}
            statusTimestamps={mockPaymentLink.statusTimestamps}
          />
          <Button onClick={handleMarkStarted}>Mark as Started</Button>
        </div>
      )
    },
    {
      key: 'Delivered',
      title: 'Work Delivered',
      summary: (
        <div className="space-y-1">
          <a href={mockDelivery.deliverableUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {mockDelivery.deliverableUrl.length > 20 ? mockDelivery.deliverableUrl.slice(0, 20) + '...' : mockDelivery.deliverableUrl}
          </a>
          {['Delivered','Complete'].includes(mockPaymentLink.status) && (
            <div className="text-xs text-gray-500">
              Delivered at {new Date(mockPaymentLink.statusTimestamps.Delivered).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <DeliverySection
            deliverableUrl={mockDelivery.deliverableUrl}
            shareOptions={mockDelivery.shareOptions}
          />
          <Button onClick={handleConfirmDelivery}>Confirm Delivery</Button>
        </div>
      )
    },
    {
      key: 'Complete',
      title: 'Job Complete',
      summary: (
        <div className="text-sm text-gray-600">
          Completed at {new Date(mockPaymentLink.statusTimestamps.Complete).toLocaleString()}
        </div>
      ),
      detail: <p>Thank you! The job is complete.</p>
    }
  ];

  // Filter sections based on current status
  const visibleSections = allSections.filter(section => 
    statusToVisibleSections[mockPaymentLink.status].includes(section.key)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4">
        <AccordionSection sections={visibleSections} currentState={mockPaymentLink.status} />
      </div>
    </div>
  );
} 