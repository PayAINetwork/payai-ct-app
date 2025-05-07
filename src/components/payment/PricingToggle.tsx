'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Currency = 'SOL' | 'PAYAI';

interface PriceData {
  data: {
    [key: string]: {
      id: string;
      type: string;
      price: string;
    };
  };
}

interface PricingToggleProps {
  amountSol: number;
  amountPayai: number;
  onCurrencyChange?: (currency: Currency) => void;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const PAYAI_MINT = 'E7NgL19JbN8BhUDgWjkH8MtnbhJoaGaWJqosxZZepump';

export function PricingToggle({ amountSol, amountPayai, onCurrencyChange }: PricingToggleProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('PAYAI');

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    onCurrencyChange?.(currency);
  };

  const { data: priceData, isLoading, error } = useQuery<PriceData>({
    queryKey: ['prices'],
    queryFn: async () => {
      const response = await fetch(
        `https://lite-api.jup.ag/price/v2?ids=${PAYAI_MINT},${SOL_MINT}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const solPrice = priceData?.data[SOL_MINT]?.price;
  const payaiPrice = priceData?.data[PAYAI_MINT]?.price;

  return (
    <div className="space-y-6">
      {/* Payment Amount Section */}
      <div className="space-y-2">
        <div className="flex justify-between text-md">
          <span className="text-muted-foreground">Payment Amount</span>
          <span className="font-medium">
            {selectedCurrency === 'SOL' ? amountSol : amountPayai} {selectedCurrency}
          </span>
        </div>
        <div className="flex justify-between text-xs -mt-2">
          <span className="text-muted-foreground">
            {selectedCurrency === 'PAYAI' && (
              <span className="text-green-600">Saving 2% on platform fees</span>
            )}
          </span>
          <span className="font-light">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : error ? (
              <span className="text-destructive">Error loading price</span>
            ) : selectedCurrency === 'SOL' ? (
              `≈$${(amountSol * Number(solPrice)).toFixed(2)}`
            ) : (
              `≈$${(amountPayai * Number(payaiPrice)).toFixed(2)}`
            )}
          </span>
        </div>
      </div>

      {/* Currency Toggle */}
      <div>
        <div className="flex justify-between text-md mb-2">
          <span className="text-muted-foreground">Pay with...</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedCurrency === 'PAYAI' ? 'default' : 'outline'}
            onClick={() => handleCurrencyChange('PAYAI')}
            className="flex-1 relative"
          >
            PAYAI
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              -2%
            </span>
          </Button>
          <Button
            variant={selectedCurrency === 'SOL' ? 'default' : 'outline'}
            onClick={() => handleCurrencyChange('SOL')}
            className="flex-1"
          >
            SOL
          </Button>
        </div>
      </div>
    </div>
  );
} 