import { Button } from '@/components/ui/button';
import { PricingToggle } from '@/components/payment/PricingToggle';
import { PaymentDetails } from '@/components/payment/PaymentDetails';
import { useState } from 'react';

interface PaymentProps {
  amountSol: number;
  amountPayai: number;
  escrowAddress: string;
  onPayClick: () => void;
  isSubmitting: boolean;
}

export function Payment({ 
  amountSol, 
  amountPayai, 
  escrowAddress, 
  onPayClick, 
  isSubmitting 
}: PaymentProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'SOL' | 'PAYAI'>('PAYAI');

  return (
    <div className="space-y-6">
      <div className="text-lg font-light">
        Make payment to get started
      </div>

      <div className="rounded-lg border p-6 space-y-6">
        <PricingToggle 
          amountSol={amountSol}
          amountPayai={amountPayai}
          onCurrencyChange={setSelectedCurrency}
        />

        <div className="border-t pt-6">
          <PaymentDetails 
            amount={selectedCurrency === 'SOL' ? amountSol : amountPayai}
            address={escrowAddress}
            currency={selectedCurrency}
          />
        </div>

        <div className="border-t pt-6">
          <Button 
            size="lg" 
            onClick={onPayClick} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Processing...' : 'Pay With Wallet'}
          </Button>
        </div>
      </div>
    </div>
  );
} 