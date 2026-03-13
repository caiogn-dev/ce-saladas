import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const resolveCardsPerView = (width, mobile, tablet, desktop) => {
  if (width < 640) return mobile;
  if (width < 1024) return tablet;
  return desktop;
};

const CarouselCard = ({
  items = [],
  renderItem,
  showCarousel = true,
  mobileCardsPerView = 1,
  tabletCardsPerView = 2,
  desktopCardsPerView = 3,
  className = '',
  trackClassName = '',
}) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(desktopCardsPerView);

  useEffect(() => {
    const syncCardsPerView = () => {
      setCardsPerView(resolveCardsPerView(window.innerWidth, mobileCardsPerView, tabletCardsPerView, desktopCardsPerView));
    };

    syncCardsPerView();
    window.addEventListener('resize', syncCardsPerView);
    return () => window.removeEventListener('resize', syncCardsPerView);
  }, [desktopCardsPerView, mobileCardsPerView, tabletCardsPerView]);

  useEffect(() => {
    if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, items.length]);

  const isSingleCard = items.length <= 1;
  const canSlide = showCarousel && items.length > cardsPerView;
  const cardWidth = 100 / cardsPerView;

  const visibleItems = useMemo(() => {
    if (!items.length) return [];
    if (!canSlide) return items;

    const nextItems = [];
    for (let i = 0; i < cardsPerView + 1; i += 1) {
      nextItems.push(items[(currentIndex + i) % items.length]);
    }
    return nextItems;
  }, [canSlide, cardsPerView, currentIndex, items]);

  const nextSlide = () => {
    if (!canSlide || isAnimating || !containerRef.current) return;

    setIsAnimating(true);
    const nextIndex = (currentIndex + 1) % items.length;

    containerRef.current.style.transition = 'transform 420ms ease';
    containerRef.current.style.transform = `translateX(-${cardWidth}%)`;

    window.setTimeout(() => {
      setCurrentIndex(nextIndex);
      if (containerRef.current) {
        containerRef.current.style.transition = 'none';
        containerRef.current.style.transform = 'translateX(0)';
        void containerRef.current.offsetWidth;
      }
      setIsAnimating(false);
    }, 420);
  };

  const prevSlide = () => {
    if (!canSlide || isAnimating || !containerRef.current) return;

    setIsAnimating(true);
    const prevIndex = (currentIndex - 1 + items.length) % items.length;

    containerRef.current.style.transition = 'none';
    containerRef.current.style.transform = `translateX(-${cardWidth}%)`;
    setCurrentIndex(prevIndex);
    void containerRef.current.offsetWidth;
    containerRef.current.style.transition = 'transform 420ms ease';
    containerRef.current.style.transform = 'translateX(0)';

    window.setTimeout(() => setIsAnimating(false), 420);
  };

  if (!items.length) {
    return null;
  }

  return (
    <div className={`carousel-card ${isSingleCard ? 'carousel-card--single' : ''} ${className}`.trim()}>
      {canSlide && (
        <>
          <button
            type="button"
            className="carousel-card__control carousel-card__control--left"
            onClick={prevSlide}
            disabled={isAnimating}
            aria-label="Ver itens anteriores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-card__control carousel-card__control--right"
            onClick={nextSlide}
            disabled={isAnimating}
            aria-label="Ver próximos itens"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <div className="carousel-card__viewport">
        <div
          ref={containerRef}
          className={`carousel-card__track ${trackClassName}`.trim()}
          style={{
            width: canSlide ? `${((cardsPerView + 1) * 100) / cardsPerView}%` : '100%',
            transform: 'translateX(0)',
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={`${item.id || item.name || 'item'}-${currentIndex}-${index}`}
              className="carousel-card__slide"
              style={{ width: canSlide ? `${100 / (cardsPerView + 1)}%` : `${100 / Math.min(cardsPerView, items.length)}%` }}
            >
              <div className="carousel-card__surface">
                {renderItem ? renderItem(item, index) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselCard;
