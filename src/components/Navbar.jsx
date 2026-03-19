import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Navbar = () => {
  const { store } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();
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
            type="button"
            className="navbar-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

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

        <button
          type="button"
          className="navbar-mobile-theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="navbar-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
