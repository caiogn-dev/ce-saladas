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
  { key: 'base',        label: 'Base',         emoji: '🥬', required: true,  max: 1,  hint: 'Escolha 1' },
  { key: 'proteina',    label: 'Proteína',      emoji: '🍗', required: false, max: 2,  hint: 'Até 2' },
  { key: 'complemento', label: 'Complementos',  emoji: '🥕', required: false, max: 6,  hint: 'Até 6' },
  { key: 'molho',       label: 'Molho',         emoji: '🫙', required: true,  max: 1,  hint: 'Escolha 1' },
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

/* ── Single ingredient row ────────────────────────────────── */
const IngredientRow = ({ product, selected, onAdd, onRemove, disabled, singleSelect }) => {
  const imgSrc = product.image_url || product.image || product.main_image_url;

  const handleAdd = (e) => { e.stopPropagation(); if (!disabled) onAdd(product); };
  const handleRemove = (e) => { e.stopPropagation(); onRemove(product); };

  return (
    <div className={`${styles.ingredientRow} ${selected ? styles.ingredientRowSelected : ''}`}>
      {imgSrc && (
        <div className={styles.ingredientImgWrapper}>
          <IngredientImage src={imgSrc} alt={product.name} />
        </div>
      )}

      <div className={styles.ingredientInfo}>
        <span className={styles.ingredientName}>{product.name}</span>
        {product.shortDescription && (
          <span className={styles.ingredientDesc}>{product.shortDescription}</span>
        )}
        <span className={styles.ingredientPrice}>{formatMoney(product.price)}</span>
        {!singleSelect && (
          <span className={styles.ingredientMax}>Máx {product.max_per_order || '∞'}</span>
        )}
      </div>

      <div className={styles.ingredientControl}>
        {singleSelect ? (
          /* Radio-style for single-select steps */
          <button
            type="button"
            className={`${styles.radioBtn} ${selected ? styles.radioBtnActive : ''}`}
            onClick={selected ? handleRemove : handleAdd}
            aria-pressed={selected}
          >
            <span className={styles.radioDot} />
          </button>
        ) : selected ? (
          /* Quantity strip for multi-select */
          <div className={styles.qtyStrip}>
            <button type="button" className={styles.qtyBtn} onClick={handleRemove} aria-label="Remover">
              −
            </button>
            <span className={styles.qtyNum}>1</span>
            <button
              type="button"
              className={`${styles.qtyBtn} ${disabled ? styles.qtyBtnDisabled : ''}`}
              onClick={handleAdd}
              disabled={disabled}
              aria-label="Adicionar mais"
            >
              +
            </button>
          </div>
        ) : (
          /* "+" add button */
          <button
            type="button"
            className={`${styles.plusBtn} ${disabled ? styles.plusBtnDisabled : ''}`}
            onClick={handleAdd}
            disabled={disabled}
            aria-label={`Adicionar ${product.name}`}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Main SaladBuilder ────────────────────────────────────── */
const SaladBuilder = ({ ingredients }) => {
  const { addSaladToCart, openCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selections, setSelections] = useState({ base: [], proteina: [], complemento: [], molho: [] });
  const bodyRef = useRef(null);

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
    [selections]
  );

  const selectedCount = Object.values(selections).flat().length;
  const isValid = selections.base.length > 0 && selections.molho.length > 0;

  const addItem = useCallback((step, product) => {
    setSelections((prev) => {
      const current = prev[step];
      const cfg = STEPS.find((s) => s.key === step);
      if (current.some((p) => p.id === product.id)) return prev;
      if (cfg.max === 1) return { ...prev, [step]: [product] };
      if (current.length < cfg.max) return { ...prev, [step]: [...current, product] };
      return prev;
    });
  }, []);

  const removeItem = useCallback((step, product) => {
    setSelections((prev) => ({
      ...prev,
      [step]: prev[step].filter((p) => p.id !== product.id),
    }));
  }, []);

  const handleAddToCart = async () => {
    if (!isValid) return;
    await addSaladToCart(selections);
    setSelections({ base: [], proteina: [], complemento: [], molho: [] });
    setIsOpen(false);
    openCart();
  };

  const handleClose = () => setIsOpen(false);

  /* Lock body scroll when modal open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const hasIngredients = (ingredients || []).length > 0;

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

      {/* ── Modal — rendered via portal to escape PageTransition transforms ── */}
      {isOpen && mounted && createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Monte sua Salada" onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderCenter}>
                <h2 className={styles.modalTitle}>Monte sua Salada</h2>
                <p className={styles.modalSubtitle}>
                  {selectedCount > 0
                    ? `${selectedCount} ingrediente${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`
                    : 'Escolha os ingredientes do seu jeito'}
                </p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Fechar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className={styles.modalBody} ref={bodyRef}>
              {!hasIngredients ? (
                <div className={styles.emptyBody}>
                  <span aria-hidden="true">🌱</span>
                  <p>Em breve, ingredientes individuais estarão disponíveis.</p>
                  <p>Por enquanto, experimente nossos combos prontos!</p>
                </div>
              ) : (
                STEPS.map((step) => {
                  const items = grouped[step.key];
                  const count = selections[step.key].length;
                  const singleSelect = step.max === 1;

                  return (
                    <div key={step.key} className={styles.stepSection}>
                      {/* Section label */}
                      <div className={`${styles.sectionHeader} ${count > 0 ? styles.sectionHeaderDone : ''}`}>
                        <div className={styles.sectionHeaderLeft}>
                          <span className={styles.sectionTitle}>{step.emoji} {step.label}</span>
                          <span className={styles.sectionMeta}>
                            {step.required ? `Obrigatório • ${step.hint}` : `Opcional • ${step.hint}`}
                          </span>
                        </div>
                        <div className={styles.sectionHeaderRight}>
                          {count > 0 && <span className={styles.sectionCount}>{count}/{step.max}</span>}
                          {step.required && count === 0 && <span className={styles.sectionRequired}>obrigatório</span>}
                        </div>
                      </div>

                      {/* Ingredient rows — always visible */}
                      <div className={styles.sectionBody}>
                        {items.length === 0 ? (
                          <p className={styles.emptySection}>Nenhum ingrediente nessa categoria.</p>
                        ) : (
                          items.map((product) => {
                            const selected = selections[step.key].some((p) => p.id === product.id);
                            const disabled = !selected && selections[step.key].length >= step.max;
                            return (
                              <IngredientRow
                                key={product.id}
                                product={product}
                                selected={selected}
                                onAdd={(p) => addItem(step.key, p)}
                                onRemove={(p) => removeItem(step.key, p)}
                                disabled={disabled}
                                singleSelect={singleSelect}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal footer */}
            <div className={styles.modalFooter}>
              {!isValid && (
                <p className={styles.footerHint}>
                  {selections.base.length === 0 && selections.molho.length === 0
                    ? 'Escolha uma base e um molho para continuar'
                    : selections.base.length === 0
                    ? 'Escolha uma base para continuar'
                    : 'Escolha um molho para continuar'}
                </p>
              )}
              <button
                type="button"
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={!isValid}
              >
                {isValid ? (
                  <>
                    <span>Adicionar à sacola</span>
                    {total > 0 && <span className={styles.addToCartTotal}>{formatMoney(total)}</span>}
                  </>
                ) : (
                  'Complete os campos obrigatórios'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SaladBuilder;
