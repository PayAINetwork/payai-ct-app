import React from 'react';

interface Offer {
  id: string;
  status: string;
  seller_id: string;
  buyer_id: string;
  job_id: string;
  created_at: string;
  amount?: number;
  // Add more fields as needed
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

async function fetchOffers(page: number = 1) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/offers?page=${page}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch offers');
  return res.json();
}

export default async function OffersPage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = Number(searchParams?.page) || 1;
  let offers: Offer[] = [];
  let pagination: Pagination = { total: 0, page, limit: 10, total_pages: 1 };
  let error = '';
  try {
    const data = await fetchOffers(page);
    offers = data.offers;
    pagination = data.pagination;
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>Offers</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Seller</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Buyer</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Job</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Created</th>
          </tr>
        </thead>
          <tbody>
            {offers.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No offers found.</td></tr>
            )}
          {offers.map(offer => (
            <tr key={offer.id}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{offer.id}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{offer.status}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{offer.seller_id}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{offer.buyer_id}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{offer.job_id}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{new Date(offer.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <a
          href={`?page=${Math.max(1, pagination.page - 1)}`}
          style={{ pointerEvents: pagination.page === 1 ? 'none' : undefined, color: pagination.page === 1 ? '#ccc' : '#0070f3' }}
        >
          Previous
        </a>
        <span>Page {pagination.page} of {pagination.total_pages}</span>
        <a
          href={`?page=${Math.min(pagination.total_pages, pagination.page + 1)}`}
          style={{ pointerEvents: pagination.page === pagination.total_pages ? 'none' : undefined, color: pagination.page === pagination.total_pages ? '#ccc' : '#0070f3' }}
        >
          Next
        </a>
      </div>
    </div>
  );
} 