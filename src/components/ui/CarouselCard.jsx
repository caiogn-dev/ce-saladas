import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const resolveCardsPerView = (width, mobile, tablet, desktop) => {
  if (width < 640) return mobile;
  if (width < 1024) return tablet;
  return desktop;
};

const resolveGap = (width) => {
  if (width < 640) return 14;
  if (width < 1024) return 16;
  return 18;
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
  const viewportRef = useRef(null);
  const [cardsPerView, setCardsPerView] = useState(desktopCardsPerView);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const syncCardsPerView = () => {
      setCardsPerView(resolveCardsPerView(window.innerWidth, mobileCardsPerView, tabletCardsPerView, desktopCardsPerView));
    };

    syncCardsPerView();
    window.addEventListener('resize', syncCardsPerView);
    return () => window.removeEventListener('resize', syncCardsPerView);
  }, [desktopCardsPerView, mobileCardsPerView, tabletCardsPerView]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setViewportWidth(entry.contentRect.width);
    });

    observer.observe(viewport);
    setViewportWidth(viewport.clientWidth);

    return () => observer.disconnect();
  }, []);

  const visibleCount = Math.max(1, Math.floor(cardsPerView));
  const canSlide = showCarousel && items.length > visibleCount;
  const totalPages = canSlide ? Math.max(1, items.length - visibleCount + 1) : 1;
  const gap = resolveGap(typeof window !== 'undefined' ? window.innerWidth : 1280);

  const slideWidth = useMemo(() => {
    if (!canSlide || !viewportWidth) {
      return null;
    }

    const calculatedWidth = (viewportWidth - gap * (cardsPerView - 1)) / cardsPerView;
    return Math.max(208, Math.floor(calculatedWidth));
  }, [canSlide, cardsPerView, gap, viewportWidth]);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const currentScrollLeft = viewport.scrollLeft;

    setCanScrollPrev(currentScrollLeft > 12);
    setCanScrollNext(currentScrollLeft < maxScrollLeft - 12);

    if (!canSlide || maxScrollLeft <= 0) {
      setActivePage(0);
      return;
    }

    const pageRatio = currentScrollLeft / maxScrollLeft;
    setActivePage(Math.min(totalPages - 1, Math.round(pageRatio * (totalPages - 1))));
  }, [canSlide, totalPages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const handleScroll = () => updateScrollState();
    handleScroll();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [items.length, cardsPerView, updateScrollState]);

  const scrollByStep = (direction) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const firstSlide = viewport.querySelector('.carousel-card__slide');
    const track = viewport.querySelector('.carousel-card__track');
    const computedGap = track ? parseFloat(window.getComputedStyle(track).gap || '0') : 0;
    const measuredSlideWidth = firstSlide ? firstSlide.getBoundingClientRect().width : viewport.clientWidth;
    const cardsToAdvance = window.innerWidth < 640 ? 1 : Math.max(1, Math.floor(cardsPerView));

    viewport.scrollBy({
      left: (measuredSlideWidth + computedGap) * cardsToAdvance * direction,
      behavior: 'smooth',
    });
  };

  if (!items.length) {
    return null;
  }

  return (
    <div className={`carousel-card ${!canSlide ? 'carousel-card--static' : ''} ${className}`.trim()}>
      {canSlide && (
        <div className="carousel-card__controls">
          <button
            type="button"
            className="carousel-card__control carousel-card__control--left"
            onClick={() => scrollByStep(-1)}
            disabled={!canScrollPrev}
            aria-label="Ver itens anteriores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-card__control carousel-card__control--right"
            onClick={() => scrollByStep(1)}
            disabled={!canScrollNext}
            aria-label="Ver próximos itens"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div ref={viewportRef} className="carousel-card__viewport">
        <div className={`carousel-card__track ${trackClassName}`.trim()}>
          {items.map((item, index) => (
            <div
              key={`${item.id || item.name || 'item'}-${index}`}
              className="carousel-card__slide"
              style={slideWidth ? { width: `${slideWidth}px`, flexBasis: `${slideWidth}px` } : undefined}
            >
              <div className="carousel-card__surface">
                {renderItem ? renderItem(item, index) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canSlide && totalPages > 1 && (
        <div className="carousel-card__pagination" aria-hidden="true">
          {Array.from({ length: totalPages }).map((_, index) => (
            <span
              key={index}
              className={`carousel-card__dot ${index === activePage ? 'carousel-card__dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselCard;
