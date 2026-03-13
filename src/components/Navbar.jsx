import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import { useStore } from '../context/StoreContext';

const Navbar = () => {
  const { store } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, toggleCart } = useCart();
  const { isAuthenticated, signOut, profile, user } = useAuth();
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const displayName = useMemo(() => {
    const firstName = profile?.first_name?.trim();
    const lastName = profile?.last_name?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const loginFirstName = user?.first_name?.trim();
    const loginLastName = user?.last_name?.trim();
    const loginFullName = [loginFirstName, loginLastName].filter(Boolean).join(' ');
    return fullName
      || loginFullName
      || profile?.email
      || profile?.phone
      || user?.email
      || user?.phone
      || 'Usuário';
  }, [profile, user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavigate = (path) => {
    closeMobileMenu();
    router.push(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo" onClick={closeMobileMenu} aria-label={store?.name || 'Início'}>
          {store?.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="navbar-logo-image" />
          ) : (
            <span className="navbar-logo-text">{store?.name || 'Store'}</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link
            href="/"
            className={`navbar-link ${isActive('/') ? 'active' : ''}`}
          >
            Início
          </Link>
          <Link
            href="/cardapio"
            className={`navbar-link ${isActive('/cardapio') ? 'active' : ''}`}
          >
            Cardápio
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/perfil"
                className={`navbar-link ${isActive('/perfil') ? 'active' : ''}`}
              >
                Perfil
              </Link>
              <span className="navbar-user">
                Olá, {displayName}
              </span>
              <button onClick={signOut} className="navbar-link navbar-logout">
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`navbar-link ${isActive('/login') ? 'active' : ''}`}
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Cart Button */}
        <button onClick={toggleCart} className="navbar-cart-btn">
          <span className="cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 6h15l-1.5 9h-12zM6 6l-1.5-3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" />
              <circle cx="18" cy="20" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="cart-text">Carrinho</span>
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </button>

        {/* Mobile Menu Button */}
        <button
          className={`navbar-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link
          href="/"
          className={`navbar-mobile-link ${isActive('/') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Início
        </Link>
        <button
          type="button"
          className={`navbar-mobile-link ${isActive('/cardapio') ? 'active' : ''}`}
          onClick={() => handleMobileNavigate('/cardapio')}
        >
          Cardápio
        </button>

        {isAuthenticated ? (
          <>
            <button
              type="button"
              className={`navbar-mobile-link ${isActive('/perfil') ? 'active' : ''}`}
              onClick={() => handleMobileNavigate('/perfil')}
            >
              Perfil
            </button>
            <span className="navbar-mobile-user">
              Olá, {displayName}
            </span>
            <button
              onClick={() => { signOut(); closeMobileMenu(); }}
              className="navbar-mobile-link navbar-mobile-logout"
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`navbar-mobile-link ${isActive('/login') ? 'active' : ''}`}
              onClick={() => handleMobileNavigate('/login')}
            >
              Entrar
            </button>
          </>
        )}
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="navbar-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
