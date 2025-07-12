"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OfferCard from "@/components/offers/OfferCard";
import { OfferFilters, OfferFilters as OfferFiltersType } from "@/components/offers/filter/OfferFilters";
import { filterOffers } from "@/components/offers/filter/offerFilterUtils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

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

async function fetchOffers() {
  const res = await fetch(`/api/offers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch offers");
  return res.json();
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<OfferFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOffers = useMemo(() => {
    return filterOffers(offers, filters);
  }, [offers, filters]);

  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOffers.slice(startIndex, endIndex);
  }, [filteredOffers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  const handleFiltersChange = (newFilters: OfferFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
          
          <OfferFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
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
          {paginatedOffers.length > 0 ? (
            <div className="space-y-6">
              {paginatedOffers.map((offer: Offer, i: number) => (
                <OfferCard key={i} offer={offer} />
              ))}
            </div>
          ) : (
            !isLoading && <div className="text-gray-600 text-center">
              {offers.length > 0 ? 'No offers match your filters.' : 'No offers found.'}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredOffers.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-20">
                      {itemsPerPage}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleItemsPerPageChange(5)}>
                      5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleItemsPerPageChange(10)}>
                      10
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleItemsPerPageChange(20)}>
                      20
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleItemsPerPageChange(50)}>
                      50
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-sm text-gray-600">per page</span>
              </div>

              {/* Page info */}
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOffers.length)} of {filteredOffers.length} offers
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="focus:outline-none focus:ring-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0 focus:outline-none focus:ring-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="focus:outline-none focus:ring-0"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 order-1 md:order-2 p-4 container mx-auto overflow-y-auto" />
      </div>
    </div>
  );
} 