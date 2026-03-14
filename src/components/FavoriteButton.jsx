import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const FavoriteButton = ({ productId, size = 'medium', showLabel = false }) => {
  const { isFavorited, toggleFavorite } = useWishlist();
  const { isAuthenticated } = useAuth();
  const favorited = isFavorited(productId);

  if (!isAuthenticated) {
    return null;
  }

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await toggleFavorite(productId);
  };

  return (
    <div className="favorite-button-wrapper">
      <button
        className={`favorite-button favorite-button-${size} ${favorited ? 'favorited' : ''}`}
        onClick={handleClick}
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
    </div>
  );
};

export default FavoriteButton;
