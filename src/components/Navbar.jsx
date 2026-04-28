import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { store } = useStore();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
          aria-label={store?.name || 'Inicio'}
        >
          {store?.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="navbar-logo-image" />
          ) : (
            <span className="navbar-logo-text">{store?.name || 'Ce Saladas'}</span>
          )}
        </Link>

        <div className="navbar-links">
          <Link href="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link href="/cardapio" className={`navbar-link ${isActive('/cardapio') ? 'active' : ''}`}>
            Cardapio
          </Link>
          <Link href="/#localizacao" className="navbar-link">
            Localizacao
          </Link>
        </div>

        <div className="navbar-actions">
          {isAuthenticated && (
            <Link href="/perfil" className="navbar-account-btn">
              Minha conta
            </Link>
          )}

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="navbar-theme-btn"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link href="/" className={`navbar-mobile-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobileMenu}>
          Inicio
        </Link>
        <button
          type="button"
          className={`navbar-mobile-link ${isActive('/cardapio') ? 'active' : ''}`}
          onClick={() => handleMobileNavigate('/cardapio')}
        >
          Cardapio
        </button>
        <button
          type="button"
          className="navbar-mobile-link"
          onClick={() => handleMobileNavigate('/#localizacao')}
        >
          Localizacao
        </button>
        {isAuthenticated && (
          <Link href="/perfil" className={`navbar-mobile-link ${isActive('/perfil') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Minha conta
          </Link>
        )}
        {isAuthenticated && (
          <Link href="/perfil?tab=orders" className="navbar-mobile-link" onClick={closeMobileMenu}>
            Meus pedidos
          </Link>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="navbar-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
