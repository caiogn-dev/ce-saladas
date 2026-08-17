import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';

// Global styles
import '../src/index.css';
import '../src/styles/forms.css';
import '../src/styles/status-pages.css';
import '../src/styles/templateColors.css';

// Component styles
import '../src/components/GenericStorefront/GenericStorefront.css';
import '../src/components/Navbar.css';
import '../src/components/CartSidebar.css';
import '../src/components/LoginModal.css';
import '../src/components/Toast.css';
import '../src/components/FavoriteButton.css';
import '../src/components/FloatingWhatsApp.css';
import '../src/components/WhatsAppOTPModal.css';
import '../src/components/ProductFilters.css';
import '../src/components/StockBadge.css';

// UI component styles
import '../src/components/ui/Button.css';
import '../src/components/ui/Badge.css';
import '../src/components/ui/Card.css';
import '../src/components/ui/Input.css';
import '../src/components/ui/EmptyState.css';
import '../src/components/ui/Modal.css';
import '../src/components/ui/OrderTimeline.css';
import '../src/components/ui/PixPayment.css';
import '../src/components/ui/Skeleton.css';
import '../src/components/ui/ProductCard.css';
import '../src/components/ui/CarouselCard.css';
import '../src/components/SplashScreen.css';

// Page styles
import '../src/pages/LandingPage.css';
import '../src/pages/Cardapio.css';
import '../src/pages/Auth.css';
import '../src/pages/CheckoutPage.css';
import '../src/pages/Profile.css';

import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider, useCart } from '../src/context/CartContext';
import { WishlistProvider } from '../src/context/WishlistContext';
import { StoreProvider } from '../src/context/StoreContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import CartSidebar from '../src/components/CartSidebar';
import FloatingWhatsApp from '../src/components/FloatingWhatsApp';
import { ToastProvider } from '../src/components/Toast';
import { fetchCsrfToken } from '../src/services/storeApi';
import StoreHead from '../src/components/StoreHead';
import StoreClosedSchedulingModal from '../src/components/StoreClosedSchedulingModal';
import MetaPixel from '../src/components/MetaPixel';
import CookieConsentBanner from '../src/components/CookieConsentBanner';
import { hasTrackingConsent } from '../src/utils/cookieConsent';

// Componente separado para acessar useCart() dentro do CartProvider
function SchedulingNoticeMount() {
  const router = useRouter();
  const { schedulingNoticeOpen, dismissSchedulingNotice } = useCart();
  return (
    <StoreClosedSchedulingModal
      isOpen={schedulingNoticeOpen}
      onClose={dismissSchedulingNotice}
      onGoCheckout={() => {
        dismissSchedulingNotice();
        router.push('/checkout');
      }}
    />
  );
}
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-7Z5V0N2EE4';

export default function App({ Component, pageProps }) {
  const storeConfig = pageProps.previewStoreConfig || null;
  const [trackingOk, setTrackingOk] = useState(false);

  useEffect(() => { setTrackingOk(hasTrackingConsent()); }, []);

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return (
    <>
      <Head />

      {trackingOk && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
      {trackingOk && <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>}

      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider
              initialCatalog={pageProps.initialCatalog || null}
              storeConfig={storeConfig}
              appConfig={pageProps.appConfig || null}
            >
              <MetaPixel consent={trackingOk} />
              <StoreHead />
              <ToastProvider>
                <WishlistProvider>
                  <CartProvider>
                    <SchedulingNoticeMount />
                    <CartSidebar />
                    <FloatingWhatsApp />
                    <Component {...pageProps} />
                  </CartProvider>
                </WishlistProvider>
              </ToastProvider>
            </StoreProvider>
          </AuthProvider>
          <CookieConsentBanner onDecision={value => setTrackingOk(value === 'accepted')} />
        </ThemeProvider>
      </ErrorBoundary>
    </>
  );
}
