import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../context/StoreContext';

const bootstrapPixel = () => {
  if (typeof window === 'undefined' || window.fbq) return;
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  window.fbq = fbq;
  window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
};

export default function MetaPixel({ consent = false }) {
  const router = useRouter();
  const { store } = useStore();
  const pixelId = String(store?.meta_pixel_id || '').trim();
  const enabled = Boolean(consent && store?.meta_pixel_enabled && /^\d+$/.test(pixelId));
  const initializedPixel = useRef('');
  const trackPage = () => {
    window.fbq?.('trackSingle', pixelId, 'PageView');
    if (/cardapio|menu|catalogo/i.test(router.asPath)) {
      window.fbq?.('trackSingle', pixelId, 'ViewContent', {
        content_name: `Cardápio ${store?.name || store?.slug || ''}`.trim(),
        content_type: 'product_group',
      });
    }
  };

  useEffect(() => {
    if (!enabled || initializedPixel.current === pixelId) return;
    bootstrapPixel();
    window.fbq('init', pixelId);
    trackPage();
    initializedPixel.current = pixelId;
  }, [enabled, pixelId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const handleRoute = () => trackPage();
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
  }, [enabled, pixelId, router.events]);

  useEffect(() => {
    if (!enabled) return undefined;
    const handleEvent = ({ detail = {} }) => {
      if (!detail.eventName) return;
      window.fbq?.('trackSingle', pixelId, detail.eventName, detail.customData || {}, detail.eventId ? { eventID: detail.eventId } : undefined);
    };
    window.addEventListener('meta:pixel-event', handleEvent);
    return () => window.removeEventListener('meta:pixel-event', handleEvent);
  }, [enabled, pixelId]);

  return null;
}
