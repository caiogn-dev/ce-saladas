import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const FavoriteButton = ({ productId, size = 'medium', showLabel = false }) => {
  const { isFavorited, toggleFavorite } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);

  const favorited = isFavorited(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginHint(true);
      setTimeout(() => setShowLoginHint(false), 2000);
      return;
    }

    setLoading(true);
    await toggleFavorite(productId);
    setLoading(false);
  };

  return (
    <div className="favorite-button-wrapper">
      <button
        className={`favorite-button favorite-button-${size} ${favorited ? 'favorited' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleClick}
        disabled={loading}
        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <svg
          viewBox="0 0 24 24"
          fill={favorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="favorite-icon"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {showLabel && (
          <span className="favorite-label">
            {favorited ? 'Favoritado' : 'Favoritar'}
          </span>
        )}
      </button>
      {showLoginHint && (
        <div className="favorite-login-hint">
          Faça login para favoritar
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
