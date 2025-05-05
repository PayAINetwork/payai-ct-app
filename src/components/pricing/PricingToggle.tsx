'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const PAYAI_MINT = 'E7NgL19JbN8BhUDgWjkH8MtnbhJoaGaWJqosxZZepump';

export function PricingToggle() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('SOL');

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
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button
          variant={selectedCurrency === 'SOL' ? 'default' : 'outline'}
          onClick={() => setSelectedCurrency('SOL')}
          className="flex-1"
        >
          SOL
        </Button>
        <Button
          variant={selectedCurrency === 'PAYAI' ? 'default' : 'outline'}
          onClick={() => setSelectedCurrency('PAYAI')}
          className="flex-1"
        >
          PAYAI
        </Button>
      </div>

      <Alert className={cn(
        "transition-colors",
        selectedCurrency === 'PAYAI' ? "bg-green-50" : "bg-blue-50"
      )}>
        <AlertDescription>
          {selectedCurrency === 'PAYAI' 
            ? "You are saving 2% by using PAYAI!"
            : "Using PAYAI waives the 2% platform fee!"
          }
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Price</span>
            <span className="font-medium">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : error ? (
                <span className="text-destructive">Error loading price</span>
              ) : selectedCurrency === 'SOL' ? (
                `$${Number(solPrice).toFixed(2)}`
              ) : (
                `$${Number(payaiPrice).toFixed(6)}`
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 