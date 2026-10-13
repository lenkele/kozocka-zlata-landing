'use client';

import { useEffect } from 'react';

import { trackMetaEvent } from '@/lib/metaPixel';

type MetaPixelPurchaseProps = {
  orderId: string;
  showSlug: string;
  value: number;
  currency: string;
  qty: number;
};

export default function MetaPixelPurchase({ orderId, showSlug, value, currency, qty }: MetaPixelPurchaseProps) {
  useEffect(() => {
    // Do not count the same order twice when the success page is reloaded.
    const storageKey = `meta_purchase_${orderId}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
    } catch {
      // storage unavailable — rely on eventID dedup on Meta's side
    }

    // fbevents.js loads afterInteractive; fbq queues calls until then, but may not exist on the very first tick.
    const timer = window.setTimeout(() => {
      trackMetaEvent(
        'Purchase',
        {
          value,
          currency,
          num_items: qty,
          content_ids: [showSlug],
          content_type: 'product',
        },
        orderId,
      );
      try {
        window.localStorage.setItem(storageKey, '1');
      } catch {
        // ignore
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [orderId, showSlug, value, currency, qty]);

  return null;
}
