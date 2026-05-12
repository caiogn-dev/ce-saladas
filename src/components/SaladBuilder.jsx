import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../context/CartContext';
import styles from './SaladBuilder.module.css';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatMoney = (v) => fmt.format(Number(v || 0));

const inferIngredientStep = (product) => {
  const haystack = [
    product.categorySlug,
    product.categoryLabel,
    product.productTypeName,
    ...(product.tags || []),
    product.name,
  ].join(' ').toLowerCase().replace(/[^\w\s]/g, '');

  if (/base|folha|rucula|alface|couve|espinafre|quinoa|repolho/.test(haystack)) return 'base';
  if (/prote|frango|atum|salmao|tofu|ovo|grao|feijao/.test(haystack)) return 'proteina';
  if (/molho|tempero|vinagrete|shoyu|azeite|tahini/.test(haystack)) return 'molho';
  return 'complemento';
};

const STEPS = [
  { key: 'base',        label: 'Base',         emoji: '🥬', required: true,  max: 1, hint: 'Escolha 1' },
  { key: 'proteina',    label: 'Proteína',      emoji: '🍗', required: false, max: 2, hint: 'Até 2 (opcional)' },
  { key: 'complemento', label: 'Complementos',  emoji: '🥕', required: false, max: 6, hint: 'Até 6 (opcional)' },
  { key: 'molho',       label: 'Molho',         emoji: '🫙', required: true,  max: 1, hint: 'Escolha 1' },
];

/* ── Ingredient image ─────────────────────────────────────── */
const IngredientImage = ({ src, alt }) => {
  const [err, setErr] = useState(false);
  if (!src || err) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={styles.ingredientImg}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
};

/* ── Single ingredient row (full-row tap target) ──────────── */
const IngredientRow = ({ product, selected, count, onAdd, onRemove, disabled, singleSelect }) => {
  const imgSrc = product.image_url || product.image || product.main_image_url;

  const handleRowClick = () => {
    if (singleSelect) {
      selected ? onRemove(product) : (!disabled && onAdd(product));
    } else {
      if (!selected && !disabled) onAdd(product);
    }
  };

  const handleMinus = (e) => { e.stopPropagation(); onRemove(product); };
  const handlePlus  = (e) => { e.stopPropagation(); if (!disabled) onAdd(product); };

  return (
    <div
      className={`${styles.ingredientRow} ${selected ? styles.ingredientRowSelected : ''} ${disabled && !selected ? styles.ingredientRowDisabled : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleRowClick() : null}
      aria-pressed={selected}
    >
      <div className={styles.ingredientImgWrapper}>
        {imgSrc
          ? <IngredientImage src={imgSrc} alt={product.name} />
          : <span className={styles.ingredientImgFallback} aria-hidden="true">·</span>
        }
      </div>

      <div className={styles.ingredientInfo}>
        <span className={styles.ingredientName}>{product.name}</span>
        {product.shortDescription && (
          <span className={styles.ingredientDesc}>{product.shortDescription}</span>
        )}
        <span className={styles.ingredientPrice}>{formatMoney(product.price)}</span>
      </div>

      <div className={styles.ingredientControl} onClick={(e) => e.stopPropagation()}>
        {singleSelect ? (
          <span className={`${styles.checkCircle} ${selected ? styles.checkCircleActive : ''}`} aria-hidden="true">
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
        ) : selected ? (
          <div className={styles.qtyStrip}>
            <button type="button" className={styles.qtyBtn} onClick={handleMinus} aria-label="Remover um">−</button>
            <span className={styles.qtyNum}>{count}</span>
            <button
              type="button"
              className={`${styles.qtyBtn} ${disabled ? styles.qtyBtnDisabled : ''}`}
              onClick={handlePlus}
              disabled={disabled}
              aria-label="Adicionar mais"
            >+</button>
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.plusBtn} ${disabled ? styles.plusBtnDisabled : ''}`}
            onClick={handlePlus}
            disabled={disabled}
            aria-label={`Adicionar ${product.name}`}
          >+</button>
        )}
      </div>
    </div>
  );
};

/* ── Step tab pill ────────────────────────────────────────── */
const StepTab = ({ step, idx, active, done, count, onClick }) => (
  <button
    type="button"
    className={`${styles.stepTab} ${active ? styles.stepTabActive : ''} ${done && !active ? styles.stepTabDone : ''}`}
    onClick={() => onClick(idx)}
    aria-current={active ? 'step' : undefined}
  >
    <span className={styles.stepTabIcon}>{done ? '✓' : String(STEPS.indexOf(step) + 1).padStart(2, '0')}</span>
    <span className={styles.stepTabLabel}>{step.label}</span>
    {done && count > 0 && !active && (
      <span className={styles.stepTabBadge}>{count}</span>
    )}
  </button>
);

/* ── Main SaladBuilder ────────────────────────────────────── */
const SaladBuilder = ({ ingredients, onAddedToCart }) => {
  const { addSaladToCart } = useCart();
  const [isOpen, setIsOpen]     = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [adding, setAdding]     = useState(false);
  const [selections, setSelections] = useState({ base: [], proteina: [], complemento: [], molho: [] });
  const bodyRef = useRef(null);
  const tabsRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const grouped = useMemo(() => {
    const groups = { base: [], proteina: [], complemento: [], molho: [] };
    (ingredients || []).forEach((p) => {
      const step = inferIngredientStep(p);
      if (groups[step]) groups[step].push(p);
    });
    return groups;
  }, [ingredients]);

  const total = useMemo(
    () => Object.values(selections).flat().reduce((s, p) => s + Number(p.price || 0), 0),
    [selections],
  );

  const isValid = selections.base.length > 0 && selections.molho.length > 0;

  /* count per item id for multi-select steps */
  const countMap = useMemo(() => {
    const map = {};
    Object.values(selections).flat().forEach((p) => { map[p.id] = (map[p.id] || 0) + 1; });
    return map;
  }, [selections]);

  const removeItem = useCallback((step, product) => {
    setSelections((prev) => {
      const arr = [...prev[step]];
      const idx = arr.findLastIndex((p) => p.id === product.id);
      if (idx !== -1) arr.splice(idx, 1);
      return { ...prev, [step]: arr };
    });
  }, []);

  const advance = useCallback((fromStepKey) => {
    clearTimeout(advanceTimer.current);
    const nextIdx = STEPS.findIndex((s) => s.key === fromStepKey) + 1;
    if (nextIdx >= STEPS.length) return;
    setActiveStep(nextIdx);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const tab = tabsRef.current?.children[nextIdx];
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  /* Auto-advance: single-select → 300ms; multi-select → 1.2s debounce from last selection */
  const handleAdd = useCallback((step, product) => {
    const cfg = STEPS.find((s) => s.key === step);
    clearTimeout(advanceTimer.current);

    if (cfg.max === 1) {
      setSelections((prev) => ({ ...prev, [step]: [product] }));
      advanceTimer.current = setTimeout(() => advance(step), 300);
    } else {
      setSelections((prev) => {
        const current = prev[step];
        if (current.length >= cfg.max) return prev;
        return { ...prev, [step]: [...current, product] };
      });
      advanceTimer.current = setTimeout(() => advance(step), 1200);
    }
  }, [advance]);

  const goToStep = useCallback((idx) => {
    clearTimeout(advanceTimer.current);
    setActiveStep(idx);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    const tab = tabsRef.current?.children[idx];
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const handleAddToCart = async () => {
    if (!isValid || adding) return;
    setAdding(true);
    try {
      await addSaladToCart(selections);
      setSelections({ base: [], proteina: [], complemento: [], molho: [] });
      setActiveStep(0);
      setIsOpen(false);
      onAddedToCart?.();
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => { setIsOpen(false); setActiveStep(0); };

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const hasIngredients = (ingredients || []).length > 0;
  const step = STEPS[activeStep];
  const items = grouped[step?.key] || [];
  const stepSelections = selections[step?.key] || [];
  const isLastStep = activeStep === STEPS.length - 1;
  const isStepDone = step?.max === 1 ? stepSelections.length >= 1 : stepSelections.length > 0;

  /* Footer CTA logic */
  const renderFooterCTA = () => {
    if (isLastStep) {
      return (
        <button
          type="button"
          className={`${styles.addToCartBtn} ${!isValid || adding ? styles.addToCartBtnDisabled : ''}`}
          onClick={handleAddToCart}
          disabled={!isValid || adding}
        >
          {adding ? (
            <span className={styles.addingSpinner} aria-hidden="true" />
          ) : isValid ? (
            <>
              <span>Adicionar à sacola</span>
              {total > 0 && <span className={styles.addToCartTotal}>· {formatMoney(total)}</span>}
            </>
          ) : (
            <span>Escolha um molho para finalizar</span>
          )}
        </button>
      );
    }

    if (!step?.required) {
      return (
        <div className={styles.footerSkip}>
          <span className={styles.footerSkipHint}>
            {isStepDone ? `${stepSelections.length} selecionado${stepSelections.length > 1 ? 's' : ''} · avançando…` : 'Opcional — escolha ou pule'}
          </span>
          <button type="button" className={styles.skipBtn} onClick={() => advance(step.key)}>
            Pular →
          </button>
        </div>
      );
    }

    return (
      <p className={styles.footerRequiredHint}>
        {isStepDone ? `✓ ${step.label} selecionada — avançando…` : `Toque em um item para selecionar`}
      </p>
    );
  };

  return (
    <>
      {/* ── CTA trigger card ── */}
      <button
        type="button"
        className={styles.cta}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <div className={styles.ctaLeft}>
          <span className={styles.ctaEmoji} aria-hidden="true">🥗</span>
          <div>
            <h3 className={styles.ctaTitle}>Monte sua Salada Perfeita</h3>
            <p className={styles.ctaDesc}>
              {hasIngredients
                ? 'Escolha base, proteínas, complementos e molho do seu jeito.'
                : 'Em breve — ingredientes individuais para montagem livre.'}
            </p>
          </div>
        </div>
        <span className={styles.ctaChevron} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </button>

      {/* ── Modal portal ── */}
      {isOpen && mounted && createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Monte sua Salada" onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <h2 className={styles.modalTitle}>Monte sua Salada</h2>
                {total > 0 && (
                  <span className={styles.modalTotal}>{formatMoney(total)}</span>
                )}
              </div>
              <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Step tabs */}
            <div className={styles.stepTabs} ref={tabsRef} role="tablist">
              {STEPS.map((s, idx) => (
                <StepTab
                  key={s.key}
                  step={s}
                  idx={idx}
                  active={idx === activeStep}
                  done={selections[s.key].length > 0}
                  count={selections[s.key].length}
                  onClick={goToStep}
                />
              ))}
            </div>

            {/* Step description */}
            <div className={styles.stepDesc}>
              <span className={styles.stepDescEmoji}>{String(STEPS.indexOf(step) + 1).padStart(2, '0')}</span>
              <div>
                <strong className={styles.stepDescTitle}>{step.label}</strong>
                <span className={styles.stepDescMeta}> · {step.hint}</span>
                {step.required && <span className={styles.stepDescRequired}> obrigatório</span>}
              </div>
              {isStepDone && (
                <span className={styles.stepDescDone}>✓</span>
              )}
            </div>

            {/* Body — scrollable items */}
            <div className={styles.modalBody} ref={bodyRef}>
              {!hasIngredients ? (
                <div className={styles.emptyBody}>
                  <p>Em breve, ingredientes individuais estarão disponíveis.</p>
                </div>
              ) : items.length === 0 ? (
                <div className={styles.emptyBody}>
                  <p>Nenhum ingrediente nesta categoria.</p>
                </div>
              ) : (
                <div className={styles.itemList}>
                  {items.map((product) => {
                    const selected = stepSelections.some((p) => p.id === product.id);
                    const count = countMap[product.id] || 0;
                    const totalSelected = stepSelections.reduce((sum, p) => sum + (countMap[p.id] || 1), 0);
                    const disabled = !selected && totalSelected >= step.max;
                    return (
                      <IngredientRow
                        key={product.id}
                        product={product}
                        selected={selected}
                        count={count}
                        onAdd={(p) => handleAdd(step.key, p)}
                        onRemove={(p) => removeItem(step.key, p)}
                        disabled={disabled}
                        singleSelect={step.max === 1}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              {renderFooterCTA()}
            </div>

          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default SaladBuilder;
