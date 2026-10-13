type Fbq = (...args: unknown[]) => void;

// Safe wrapper: never throws, no-op if the pixel is blocked or not loaded yet.
export function trackMetaEvent(event: string, params?: Record<string, unknown>, eventId?: string): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== 'function') return;

  try {
    if (eventId) {
      fbq('track', event, params ?? {}, { eventID: eventId });
    } else {
      fbq('track', event, params ?? {});
    }
  } catch (error) {
    console.error('[meta-pixel] track failed', error);
  }
}
