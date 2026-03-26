import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

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
import { ToastProvider } from '../src/components/Toast';
import { fetchCsrfToken } from '../src/services/storeApi';
import StoreHead from '../src/components/StoreHead';

const GA_ID = 'G-HYLXDEXLMC';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return (
    <>
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
