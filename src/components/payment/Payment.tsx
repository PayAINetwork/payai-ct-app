import { PricingToggle } from '@/components/payment/PricingToggle';
import { PaymentDetails } from '@/components/payment/PaymentDetails';
import { PaymentButton } from '@/components/payment/PaymentButton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { useState } from 'react';

interface PaymentProps {
  amountSol: number;
  amountPayai: number;
  escrowAddress: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

export function Payment({ 
  amountSol, 
  amountPayai, 
  escrowAddress,
  onSuccess,
  onError
}: PaymentProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'SOL' | 'PAYAI'>('PAYAI');
  const [txStatus, setTxStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const handlePaymentSuccess = (signature: string) => {
    setTxStatus('success');
    setTxSignature(signature);
    onSuccess?.(signature);
  };

  const handlePaymentError = (error: Error) => {
    setTxStatus('failed');
    setTxError(error.message);
    onError?.(error);
  };

  const dismissAlert = () => {
    setTxStatus('idle');
    setTxSignature(null);
    setTxError(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-light px-4 mt-2">
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
          <PaymentButton 
            amount={selectedCurrency === 'SOL' ? amountSol : amountPayai}
            currency={selectedCurrency}
            escrowAddress={escrowAddress}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {txStatus !== 'idle' && (
          <div className="border-t pt-6">
            <Alert className={txStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <X className="h-4 w-4" onClick={dismissAlert} />
              <AlertTitle className={txStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                {txStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
              </AlertTitle>
              <AlertDescription className={txStatus === 'success' ? 'text-green-700' : 'text-red-700'}>
                {txStatus === 'success' ? (
                  <a 
                    href={`https://solscan.io/tx/${txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 hover:underline"
                  >
                    View transaction on Solscan
                  </a>
                ) : (
                  txError
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
} 