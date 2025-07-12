import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface OfferCardProps {
  offer: {
    job_id?: number | string;
    buyer_name?: string;
    escrow_address: string;
    currency?: string;
    amount?: number;
    description?: string;
    status?: string;
    created_at?: string;
  };
  loading?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, loading = false }) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = () => {
    if (offer.job_id && !loading && !isNavigating) {
      setIsNavigating(true);
      router.push(`/jobs/${offer.job_id}`);
    }
  };

  return (
    <div className="relative">
      <Card
        className={`w-full max-w-2xl mx-auto cursor-pointer transition-opacity ${loading || isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={handleCardClick}
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
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              offer.status === 'created' ? 'bg-blue-100 text-blue-800' :
              offer.status === 'started' ? 'bg-yellow-100 text-yellow-800' :
              offer.status === 'funded' ? 'bg-green-100 text-green-800' :
              offer.status === 'completed' ? 'bg-purple-100 text-purple-800' :
              offer.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
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
          {offer.escrow_address && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(offer.escrow_address, '_blank');
                }}
                className="w-full"
              >
                View Escrow Listing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {(loading || isNavigating) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default OfferCard; 