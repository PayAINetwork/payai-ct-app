"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OfferCard from "@/components/offers/OfferCard";

interface Offer {
  job_id?: number | string;
  buyer_name?: string;
  currency?: string;
  amount?: number;
  description?: string;
  status?: string;
  created_at?: string;
}

async function fetchOffers() {
  const res = await fetch(`/api/offers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch offers");
  return res.json();
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setIsLoading(true);
    fetchOffers()
      .then((data) => {
        setOffers(data.offers || []);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block flex-1" />
        <div className="flex-1 order-2 md:order-1 p-4 container mx-auto overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Offers</h1>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="w-full max-w-2xl mx-auto">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {offers.length > 0 ? (
            <div className="space-y-6">
              {offers.map((offer: Offer, i: number) => (
                <OfferCard key={i} offer={offer} />
              ))}
            </div>
          ) : (
            !isLoading && <div className="text-gray-600 text-center">No offers found.</div>
          )}
        </div>
        <div className="flex-1 order-1 md:order-2 p-4 container mx-auto overflow-y-auto" />
      </div>
    </div>
  );
} 