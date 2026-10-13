'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { trackMetaEvent } from '@/lib/metaPixel';

// The inline pixel script in layout.tsx sends the first PageView.
// This one covers client-side navigations, which do not reload the script.
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackMetaEvent('PageView');
  }, [pathname]);

  return null;
}
