import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

export interface OfferFilters {
  buyerName?: string;
  description?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

interface OfferFiltersProps {
  filters: OfferFilters;
  onFiltersChange: (filters: OfferFilters) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: 'created', label: 'Created' },
  { value: 'funded', label: 'Funded' },
  { value: 'started', label: 'Started' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currencyOptions = [
  { value: 'SOL', label: 'SOL' },
  { value: 'PAYAI', label: 'PAYAI' },
];

export const OfferFilters: React.FC<OfferFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof OfferFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Offers
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="focus:outline-none focus:ring-0"
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search by Buyer Name */}
          <div className="space-y-2">
            <Label htmlFor="buyerName">Buyer Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="buyerName"
                placeholder="Search by buyer name..."
                value={filters.buyerName || ''}
                onChange={(e) => handleFilterChange('buyerName', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search by Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="description"
                placeholder="Search by job description..."
                value={filters.description || ''}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Badge
                  key={status.value}
                  variant={filters.status === status.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 focus:outline-none focus:ring-0"
                  onClick={() => handleFilterChange('status', filters.status === status.value ? undefined : status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="1000"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Currency Filter */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <div className="flex flex-wrap gap-2">
              {currencyOptions.map((currency) => (
                <Badge
                  key={currency.value}
                  variant={filters.currency === currency.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 focus:outline-none focus:ring-0"
                  onClick={() => handleFilterChange('currency', filters.currency === currency.value ? undefined : currency.value)}
                >
                  {currency.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="flex items-center gap-2 focus:outline-none focus:ring-0"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {filters.buyerName && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Buyer: {filters.buyerName}
                <X 
                  className="h-3 w-3 cursor-pointer focus:outline-none focus:ring-0" 
                  onClick={() => handleFilterChange('buyerName', undefined)}
                />
              </Badge>
            )}
            {filters.description && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Description: {filters.description}
                <X 
                  className="h-3 w-3 cursor-pointer focus:outline-none focus:ring-0" 
                  onClick={() => handleFilterChange('description', undefined)}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer focus:outline-none focus:ring-0" 
                  onClick={() => handleFilterChange('status', undefined)}
                />
              </Badge>
            )}
            {filters.currency && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Currency: {filters.currency}
                <X 
                  className="h-3 w-3 cursor-pointer focus:outline-none focus:ring-0" 
                  onClick={() => handleFilterChange('currency', undefined)}
                />
              </Badge>
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Amount: {filters.minAmount || 0} - {filters.maxAmount || '∞'}
                <X 
                  className="h-3 w-3 cursor-pointer focus:outline-none focus:ring-0" 
                  onClick={() => {
                    handleFilterChange('minAmount', undefined);
                    handleFilterChange('maxAmount', undefined);
                  }}
                />
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 