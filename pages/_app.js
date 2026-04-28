import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';

// Global styles
import '../src/index.css';
import '../src/styles/forms.css';
import '../src/styles/status-pages.css';

// Component styles
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
import '../src/components/ui/ShaderBackground.css';
import '../src/components/ui/CarouselCard.css';

// Page styles
import '../src/pages/LandingPage.css';
import '../src/pages/Cardapio.css';
import '../src/pages/Auth.css';
import '../src/pages/CheckoutPage.css';
import '../src/pages/Profile.css';

import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { WishlistProvider } from '../src/context/WishlistContext';
import { StoreProvider } from '../src/context/StoreContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import CartSidebar from '../src/components/CartSidebar';
import FloatingWhatsApp from '../src/components/FloatingWhatsApp';
import { ToastProvider } from '../src/components/Toast';
import { fetchCsrfToken } from '../src/services/storeApi';
import StoreHead from '../src/components/StoreHead';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-7Z5V0N2EE4';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1301947998542003';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`,
          }}
        />
      </Head>

      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>

      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider initialCatalog={pageProps.initialCatalog || null}>
              <StoreHead />
              <ToastProvider>
                <WishlistProvider>
                  <CartProvider>
                    <CartSidebar />
                    <FloatingWhatsApp />
                    <Component {...pageProps} />
                  </CartProvider>
                </WishlistProvider>
              </ToastProvider>
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </>
  );
}
