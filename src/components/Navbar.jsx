import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
const Navbar = () => {
  const { store } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleMobileNavigate = (path) => {
    closeMobileMenu();
    router.push(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button
          className={`navbar-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Link
          href="/"
          className="navbar-logo"
          onClick={closeMobileMenu}
          aria-label={store?.name || 'Início'}
        >
          {store?.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="navbar-logo-image" />
          ) : (
            <span className="navbar-logo-text">{store?.name || 'Cê Saladas'}</span>
          )}
        </Link>

        <div className="navbar-links">
          <Link href="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
            Início
          </Link>
          <Link href="/cardapio" className={`navbar-link ${isActive('/cardapio') ? 'active' : ''}`}>
            Cardápio
          </Link>
        </div>

        <div className="navbar-actions">
          <button
            key={cartCount > 0 ? `navbar-cart-${cartCount}` : 'navbar-cart-empty'}
            onClick={openCart}
            className={`navbar-cart-btn ${cartCount > 0 ? 'pulse' : ''}`}
            aria-label="Abrir sacola"
          >
            <span className="cart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M6 6h15l-1.5 9h-12zM6 6l-1.5-3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="18" cy="20" r="1.5" fill="currentColor" />
              </svg>
            </span>
            <span className="cart-text">Sacola</span>
            {cartCount > 0 && <span className="cart-badge pulse">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link href="/" className={`navbar-mobile-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobileMenu}>
          Início
        </Link>
        <button
          type="button"
          className={`navbar-mobile-link ${isActive('/cardapio') ? 'active' : ''}`}
          onClick={() => handleMobileNavigate('/cardapio')}
        >
          Cardápio
        </button>

      </div>

      {mobileMenuOpen && (
        <div className="navbar-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
