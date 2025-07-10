import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface OfferCardProps {
  offer: {
    job_id?: number | string;
    buyer_name?: string;
    currency?: string;
    amount?: number;
    description?: string;
    status?: string;
    created_at?: string;
  };
  loading?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, loading = false }) => {
  return (
    <div className="relative">
      <Card
        className={`w-full max-w-2xl mx-auto cursor-pointer transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            {/* Use buyer initials or fallback */}
            <AvatarFallback>{offer.buyer_name?.slice(0, 2).toUpperCase() || 'US'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{offer.buyer_name || 'Buyer'}</span>
            <span className="text-sm text-muted-foreground">Job ID: {offer.job_id}</span>
          </div>
          <div className="ml-auto">
            <span className="px-2 py-1 rounded bg-gray-200 text-xs font-medium">
              {offer.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-lg font-medium">{offer.description}</div>
          <div className="text-sm text-gray-600">
            Amount: {offer.amount} {offer.currency}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Created: {offer.created_at ? new Date(offer.created_at).toLocaleString() : ''}
          </div>
        </CardContent>
      </Card>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default OfferCard; 