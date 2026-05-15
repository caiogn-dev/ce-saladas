import React, { useRef, useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { buildMediaUrl } from '../utils/media';

/**
 * ComboCard Component
 * Displays a combo bundle with its included items and pricing
 */
const ComboCard = ({ combo }) => {
  const { addComboToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);

  const nome = combo.name || combo.nome;
  const descricao = combo.description || combo.descricao;
  const preco = combo.price || combo.preco;
  const preco_original = combo.original_price || combo.preco_original;
  const rawImageUrl = combo.main_image_url || combo.image_url || combo.imagem_url || combo.image;
  const imagem_url = buildMediaUrl(rawImageUrl);
  const destaque = combo.is_featured || combo.destaque;
  const molhos_inclusos = combo.molhos_inclusos || combo.sauces || [];
  const carne_inclusa = combo.carne_inclusa || combo.meat;
  const rondelli_incluso = combo.rondelli_incluso || combo.rondelli;
  const economia = combo.savings || combo.economia;
  const percentual_desconto = combo.discount_percent || combo.percentual_desconto;

  // Catch images that loaded before React attached onLoad (fast CDN / hydration race)
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) setImageLoaded(true);
    else if (img.complete && img.naturalWidth === 0) setImageError(true);
  }, [imagem_url]);

  const handleAddToCart = () => {
    addComboToCart(combo);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-marsala/10 relative group">
      {/* Badges */}
      {destaque && (
        <div className="absolute right-4 top-4 z-10">
          <span className="bg-marsala text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse-slow">
            🔥 MAIS PEDIDO
          </span>
        </div>
      )}
      
      {percentual_desconto > 0 && (
        <div className="absolute left-4 top-4 z-10">
          <span className="bg-success-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            -{percentual_desconto}%
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative pb-[50%] overflow-hidden bg-gray-100">
        {imagem_url && !imageError ? (
          <img
            ref={imgRef}
            src={imagem_url}
            alt={nome}
            className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-marsala mb-4 font-display">{nome}</h3>
        
        {descricao && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{descricao}</p>
        )}

        {/* Combo Contents */}
        <div className="space-y-3 text-gray-700 mb-6">
          {/* Molhos */}
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🍷</span>
            <div className="text-sm">
              <span className="font-semibold">Molhos: </span>
              {molhos_inclusos.length > 0 ? (
                <span className="text-gray-600">
                  {molhos_inclusos.map((m, i) => (
                    <span key={m.id}>
                      {m.tipo_display} ({m.quantidade})
                      {i < molhos_inclusos.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>

          {/* Carne */}
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🥩</span>
            <div className="text-sm">
              <span className="font-semibold">Carne: </span>
              {carne_inclusa ? (
                <span className="text-gray-600">
                  {carne_inclusa.tipo_display} ({carne_inclusa.quantidade})
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>

          {/* Rondelli */}
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🍝</span>
            <div className="text-sm">
              <span className="font-semibold">Rondelli: </span>
              {rondelli_incluso ? (
                <span className="text-gray-600">
                  {rondelli_incluso.sabor_display} ({rondelli_incluso.quantidade})
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            {preco_original && preco_original > preco && (
              <span className="text-sm text-gray-400 line-through block">
                R$ {Number(preco_original).toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900">
              R$ {Number(preco).toFixed(2)}
            </span>
            {economia > 0 && (
              <span className="text-xs text-success-600 block">
                Economia de R$ {Number(economia).toFixed(2)}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-marsala text-white px-6 py-3 rounded-full font-semibold hover:bg-marsala-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboCard;
