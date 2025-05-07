'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface PaymentDetailsProps {
  amount: number;
  address: string;
  currency: string;
}

export function PaymentDetails({ amount, address, currency }: PaymentDetailsProps) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAmount = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(amount.toString());
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleCopyAddress = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="">
      {/* Amount Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Send {currency}</h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={amount}
            className="flex-1 rounded-md border p-2 bg-gray-50 text-xs"
          />
          <Button variant="outline" size="icon" onClick={handleCopyAmount}>
            {copiedAmount ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy amount</span>
          </Button>
        </div>
        {copiedAmount && <p className="text-green-500 text-sm">Amount copied to clipboard!</p>}
      </div>

      {/* Address Section */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold">To</h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={address}
            className="flex-1 rounded-md border p-2 bg-gray-50 text-xs"
          />
          <Button variant="outline" size="icon" onClick={handleCopyAddress}>
            {copiedAddress ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy address</span>
          </Button>
        </div>
        {copiedAddress && <p className="text-green-500 text-sm">Address copied to clipboard!</p>}
      </div>
    </div>
  );
} 