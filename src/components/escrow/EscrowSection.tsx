'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

interface EscrowSectionProps {
  address: string;
}

// Dynamically load QRCodeCanvas with a loading skeleton
const QRCodeCanvasDynamic = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeCanvas),
  {
    ssr: false,
    loading: () => <div className="h-32 w-32 bg-gray-200 animate-pulse rounded-md" />,  
  }
);

// Error boundary for QR code rendering errors
class QRCodeErrorBoundary extends React.Component<{
  children: React.ReactNode;
}, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  resetError = () => {
    this.setState({ hasError: false });
  };
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error rendering QR code', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-destructive text-sm">Failed to load QR code</p>
          <Button variant="outline" size="sm" onClick={this.resetError}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function EscrowSection({ address }: EscrowSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h2 className="text-lg font-semibold">Escrow Address</h2>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          readOnly
          value={address}
          className="flex-1 rounded-md border p-2 bg-gray-50 text-xs"
        />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy</span>
        </Button>
      </div>
      {copied && <p className="text-green-500 text-sm">Copied to clipboard!</p>}

      {/* QR Code Section */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold">QR Code</h2>
        <div className="mt-2 flex justify-center">
          <QRCodeErrorBoundary>
            <QRCodeCanvasDynamic
              value={address}
              size={128}
              bgColor="#ffffff"
              fgColor="#000000"
              includeMargin={true}
            />
          </QRCodeErrorBoundary>
        </div>
      </div>

      {/* Solana Explorer Link */}
      <div className="pt-4 text-center">
        <a
          href={`https://explorer.solana.com/account/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
        >
          View on Solscan
        </a>
      </div>
    </div>
  );
} 