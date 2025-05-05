'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export interface DeliverySectionProps {
  deliverableUrl: string;
  shareOptions?: {
    title?: string;
    text?: string;
  };
}

export function DeliverySection({ deliverableUrl, shareOptions }: DeliverySectionProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          url: deliverableUrl,
          title: shareOptions?.title,
          text: shareOptions?.text,
        });
      } catch (err) {
        console.error('Share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(deliverableUrl);
        setFeedbackMessage('Link copied to clipboard');
        setTimeout(() => setFeedbackMessage(null), 3000);
      } catch (err) {
        console.error('Copy failed', err);
        setFeedbackMessage('Failed to copy link');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-2">
      <a
        href={deliverableUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {deliverableUrl}
      </a>
      <Button onClick={handleShare} variant="ghost" size="icon">
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share</span>
      </Button>
      {feedbackMessage && (
        <p className="text-sm text-green-500" role="status">
          {feedbackMessage}
        </p>
      )}
    </div>
  );
} 