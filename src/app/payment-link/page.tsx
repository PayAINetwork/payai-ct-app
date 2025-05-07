'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AgentCard } from '@/components/agents/AgentCard';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { useQuery } from '@tanstack/react-query';
import { EscrowSection } from '@/components/escrow/EscrowSection';
import { StatusTimeline, TimelineStatus } from '@/components/timeline/StatusTimeline';
import { DeliverySection } from '@/components/delivery/DeliverySection';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getMint } from '@solana/spl-token';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import AccordionSection, { SectionItem } from '@/components/AccordionSection';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  userSpecifiedAmount: 20000,
  userSpecifiedCurrency: 'PAYAI',
  amountSol: 0.0557,
  amountPayai: 20000,
  status: 'Unfunded' as TimelineStatus,
  escrowAddress: '79yTpy8uwmAkrdgZdq6ZSBTvxKsgPrNqTLvYQBh1pump',
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

export default function PaymentLinkPage() {
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return mockAgent;
    }
  });

  // Wallet and balance state
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  // PAYAI token mint and balance state
  const PAYAI_MINT_ADDRESS = 'E7NgL19JbN8BhUDgWjkH8MtnbhJoaGaWJqosxZZepump';
  const payaiMint = new PublicKey(PAYAI_MINT_ADDRESS);
  const [payaiBalance, setPayaiBalance] = useState<number | null>(null);
  const [payaiDecimals, setPayaiDecimals] = useState<number | null>(null);

  // Track pending payment for seamless connect then pay flow
  const [pendingPayment, setPendingPayment] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch SOL balance
      connection.getBalance(publicKey)
        .then(balance => setSolBalance(balance / LAMPORTS_PER_SOL))
        .catch(err => {
          console.error('Failed to fetch SOL balance', err);
          setSolBalance(null);
        });
      // Fetch PAYAI token balance
      connection.getParsedTokenAccountsByOwner(publicKey, { mint: payaiMint })
        .then(resp => {
          const info = resp.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
          if (info) {
            setPayaiBalance(info.uiAmount);
            setPayaiDecimals(info.decimals);
          } else {
            setPayaiBalance(0);
            setPayaiDecimals(null);
          }
        })
        .catch(err => {
          console.error('Failed to fetch PAYAI balance', err);
          setPayaiBalance(null);
          setPayaiDecimals(null);
        });
    } else {
      setSolBalance(null);
      setPayaiBalance(null);
      setPayaiDecimals(null);
    }
  }, [connection, publicKey, connected]);

  // Auto-trigger payment once wallet connected after initial click
  useEffect(() => {
    if (connected && pendingPayment) {
      // Close the wallet modal if open
      setVisible(false);
      // Proceed with payment
      handlePayment();
      // Reset pending state
      setPendingPayment(false);
    }
  }, [connected, pendingPayment]);

  // Transaction submission state and handler
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Transaction status states
  const [txStatus, setTxStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Handler to dismiss alerts
  const dismissAlert = () => {
    setTxStatus('idle');
    setTxSignature(null);
    setTxError(null);
  };

  // Wrapper click handler: prompt connect if not connected
  const handlePayClick = () => {
    if (!connected) {
      setPendingPayment(true);
      setVisible(true);
    } else {
      handlePayment();
    }
  };

  const handlePayment = async () => {
    if (!connected || !publicKey) return;
    // Reset transaction states
    setTxStatus('processing');
    setTxError(null);
    setTxSignature(null);
    setIsSubmitting(true);
    try {
      let tx;
      if (mockPaymentLink.currency === 'PAYAI') {
        // Fetch token mint to determine decimals
        const mintInfo = await getMint(connection, payaiMint);
        const decimals = mintInfo.decimals;
        const userTokenAccount = await getAssociatedTokenAddress(payaiMint, publicKey);
        const escrowPubkey = new PublicKey(mockPaymentLink.escrowAddress);
        const escrowTokenAccount = await getAssociatedTokenAddress(payaiMint, escrowPubkey);
        // Ensure escrow associated token account exists
        const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
        const instructions = [];
        if (!escrowAccountInfo) {
          const createATAIx = createAssociatedTokenAccountInstruction(
            publicKey,
            escrowTokenAccount,
            escrowPubkey,
            payaiMint
          );
          instructions.push(createATAIx);
        }
        // Calculate raw transfer amount
        const rawAmount = Math.round(mockPaymentLink.amountPayai * Math.pow(10, decimals));
        const transferIx = createTransferCheckedInstruction(
          userTokenAccount,
          payaiMint,
          escrowTokenAccount,
          publicKey,
          rawAmount,
          decimals
        );
        instructions.push(transferIx);
        tx = new Transaction().add(...instructions);
      } else {
        tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(mockPaymentLink.escrowAddress),
            lamports: mockPaymentLink.amountSol * LAMPORTS_PER_SOL,
          })
        );
      }
      const signature = await sendTransaction(tx, connection);
      setTxStatus('success');
      setTxSignature(signature);
      await connection.confirmTransaction(signature, 'processed');
      console.log('Transaction sent with signature', signature);
    } catch (err) {
      console.error('Transaction failed', err);
      setTxStatus('failed');
      setTxError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action handlers for accordion
  const handleNotifyAgent = () => console.log('Notify Agent clicked');
  const handleMarkStarted = () => console.log('Mark as Started clicked');
  const handleConfirmDelivery = () => console.log('Confirm Delivery clicked');

  // Accordion sections configuration
  const sections: SectionItem[] = [
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
            {mockPaymentLink.buyerXName} hiring {agent?.name}
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
          <div>{mockPaymentLink.status === 'Unfunded' ? 'Awaiting Payment' : mockPaymentLink.status} - {mockPaymentLink.userSpecifiedAmount} {mockPaymentLink.userSpecifiedCurrency}</div>
          {mockPaymentLink.status !== 'Unfunded' && (
            <div className="text-xs text-gray-500">
              Funded at {new Date(mockPaymentLink.statusTimestamps.Funded).toLocaleString()}
            </div>
          )}
        </div>
      ),
      detail: (
        <div className="space-y-4">
          <div className="text-lg font-light">
            Make payment so that {agent?.name} can get started.
          </div>
          <PricingToggle amountSol={mockPaymentLink.amountSol} amountPayai={mockPaymentLink.amountPayai} />
          <EscrowSection address={mockPaymentLink.escrowAddress} />
          <Button size="lg" onClick={handlePayClick} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Pay With Wallet'}
          </Button>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4">
        <AccordionSection sections={sections} currentState={mockPaymentLink.status} />
      </div>
    </div>
  );
} 