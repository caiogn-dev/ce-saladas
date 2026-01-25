import React, { useState, useEffect } from 'react';
import * as storeApi from '../services/storeApi';

const ProductFilters = ({ 
  onFilterChange, 
  onSearchChange, 
  selectedCategory, 
  searchQuery,
  showFavoritesOnly,
  onFavoritesToggle 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        // Get categories from catalog
        const catalog = await storeApi.getCatalog();
        if (isMounted) {
          // Extract category names from catalog
          const categoryNames = (catalog.categories || []).map(c => c.name);
          setCategories(categoryNames);
        }
      } catch {
        // Silently fail - categories will be empty
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="product-filters">
      {/* Search */}
      <div className="filter-search">
        <svg 
          className="search-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="search-clear" 
            onClick={() => onSearchChange('')}
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="filter-categories">
        <button
          className={`category-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => onFilterChange('')}
        >
          Todos
        </button>
        {!loading && categories.map((category) => (
          <button
            key={category}
            className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onFilterChange(category)}
          >
            {category}
          </button>
        ))}
        {onFavoritesToggle && (
          <button
            className={`category-chip favorites-chip ${showFavoritesOnly ? 'active' : ''}`}
            onClick={onFavoritesToggle}
          >
            ❤️ Favoritos
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
