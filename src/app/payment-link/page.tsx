'use client';

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

const mockPaymentLink = {
  id: '1',
  amount: 20000,
  currency: 'PAYAI',
  status: 'Funded' as TimelineStatus,
  escrowAddress: '79yTpy8uwmAkrdgZdq6ZSBTvxKsgPrNqTLvYQBh1pump',
};

// Mock timestamps for each status
const mockTimestamps: Record<TimelineStatus, string> = {
  Unfunded: '2023-07-01T12:00:00Z',
  Funded: '2023-07-02T15:30:00Z',
  'Work Started': '2023-07-03T10:00:00Z',
  'Work Delivered': '2023-07-04T08:45:00Z',
  Complete: '2023-07-05T18:15:00Z',
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
        const rawAmount = Math.round(mockPaymentLink.amount * Math.pow(10, decimals));
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
            lamports: mockPaymentLink.amount * LAMPORTS_PER_SOL,
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
      summary: <>{agent?.name} - {agent?.handle}</>,
      detail: <p>Full order description goes here.</p>
    },
    {
      key: 'Unfunded',
      title: 'Payment',
      summary: `${mockPaymentLink.amount} ${mockPaymentLink.currency} - ${mockPaymentLink.status}`,
      detail: (
        <Button size="lg" onClick={handlePayClick} disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Pay With Wallet'}
        </Button>
      )
    },
    {
      key: 'Funded',
      title: 'Awaiting Agent',
      summary: <>{agent?.name} - {agent?.status}</>,
      detail: <Button onClick={handleNotifyAgent}>Notify Agent</Button>
    },
    {
      key: 'Work Started',
      title: 'Job In Progress',
      summary: mockTimestamps['Work Started'],
      detail: <Button onClick={handleMarkStarted}>Mark as Started</Button>
    },
    {
      key: 'Work Delivered',
      title: 'Work Delivered',
      summary: (
        <a href={mockDelivery.deliverableUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {mockDelivery.deliverableUrl.length > 20 ? mockDelivery.deliverableUrl.slice(0, 20) + '...' : mockDelivery.deliverableUrl}
        </a>
      ),
      detail: <Button onClick={handleConfirmDelivery}>Confirm Delivery</Button>
    },
    {
      key: 'Complete',
      title: 'Job Complete',
      summary: mockTimestamps['Complete'],
      detail: <p>Thank you! The job is complete.</p>
    }
  ];

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
            <WalletMultiButton className="h-8" />
            {connected && solBalance !== null && (
              <span className="ml-2 text-sm font-medium">{solBalance.toFixed(3)} SOL</span>
            )}
            {connected && payaiBalance !== null && (
              <span className="ml-2 text-sm font-medium">{payaiBalance.toFixed(6)} PAYAI</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <section>
            <PricingToggle />
          </section>
          {/* Escrow Section */}
          <EscrowSection address={mockPaymentLink.escrowAddress} />
          {/* Pay With Wallet Button under QR Code */}
          <div className="mt-4 flex justify-center">
            <Button size="lg" onClick={handlePayClick} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Pay With Wallet'}
            </Button>
          </div>
          {/* Transaction Feedback Alerts */}
          {txStatus === 'processing' && (
            <Alert className="mt-4 relative">
              <button
                onClick={dismissAlert}
                className="absolute top-2 right-2 text-muted-foreground hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertDescription>Transaction is processing...</AlertDescription>
            </Alert>
          )}
          {txStatus === 'success' && txSignature && (
            <Alert className="mt-4 transition-colors bg-green-50 relative">
              <button
                onClick={dismissAlert}
                className="absolute top-2 right-2 text-muted-foreground hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Transaction succeeded. <a href={`https://solscan.io/tx/${txSignature}`} target="_blank" rel="noopener noreferrer" className="underline">View on Solscan.</a>
              </AlertDescription>
            </Alert>
          )}
          {txStatus === 'failed' && (
            <Alert variant="destructive" className="mt-4 relative">
              <button
                onClick={dismissAlert}
                className="absolute top-2 right-2 text-destructive hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Transaction failed: {txError}</AlertDescription>
            </Alert>
          )}
          {/* Status Timeline */}
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Status Timeline</h2>
            <StatusTimeline
              currentStatus={mockPaymentLink.status}
              statusTimestamps={mockTimestamps}
            />
          </section>
          {/* Delivery Section */}
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <DeliverySection
              deliverableUrl={mockDelivery.deliverableUrl}
              shareOptions={mockDelivery.shareOptions}
            />
          </section>
        </div>
        {/* Accordion at bottom */}
        <div className="mx-auto max-w-3xl mt-8">
          <AccordionSection sections={sections} currentState={mockPaymentLink.status} />
        </div>
      </main>
    </div>
  );
} 