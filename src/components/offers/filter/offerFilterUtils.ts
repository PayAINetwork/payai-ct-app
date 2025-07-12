import { OfferFilters } from './OfferFilters';

interface Offer {
  job_id?: number | string;
  buyer_name?: string;
  escrow_address: string;
  currency?: string;
  amount?: number;
  description?: string;
  status?: string;
  created_at?: string;
}

export const filterOffers = (offers: Offer[], filters: OfferFilters): Offer[] => {
  return offers.filter(offer => {
    // Filter by buyer name
    if (filters.buyerName && offer.buyer_name) {
      const offerName = offer.buyer_name.toLowerCase();
      const filterName = filters.buyerName.toLowerCase();
      if (!offerName.includes(filterName)) {
        return false;
      }
    }

    // Filter by description
    if (filters.description && offer.description) {
      const offerDescription = offer.description.toLowerCase();
      const filterDescription = filters.description.toLowerCase();
      if (!offerDescription.includes(filterDescription)) {
        return false;
      }
    }

    // Filter by status
    if (filters.status && offer.status !== filters.status) {
      return false;
    }

    // Filter by amount range
    if (filters.minAmount && offer.amount) {
      if (offer.amount < filters.minAmount) {
        return false;
      }
    }

    if (filters.maxAmount && offer.amount) {
      if (offer.amount > filters.maxAmount) {
        return false;
      }
    }

    // Filter by currency
    if (filters.currency && offer.currency) {
      if (offer.currency !== filters.currency) {
        return false;
      }
    }

    return true;
  });
}; 