import React, { useState, useMemo, useCallback } from 'react';
import styles from './SaladBuilder.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
const formatMoney = (v) => currencyFormatter.format(Number(v || 0));

// Infer ingredient step from product type/category
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
  { key: 'base',        label: 'Base',         emoji: '🥬', required: true,  max: 1,  hint: 'Escolha 1 base' },
  { key: 'proteina',    label: 'Proteína',      emoji: '🍗', required: false, max: 2,  hint: 'Até 2 proteínas' },
  { key: 'complemento', label: 'Complementos',  emoji: '🥕', required: false, max: 6,  hint: 'Até 6 complementos' },
  { key: 'molho',       label: 'Molho',         emoji: '🫙', required: true,  max: 1,  hint: 'Escolha 1 molho' },
];

const IngredientChip = ({ product, selected, onToggle, max, stepCount }) => {
  const disabled = !selected && stepCount >= max;
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.chipSelected : ''} ${disabled ? styles.chipDisabled : ''}`}
      onClick={() => !disabled && onToggle(product)}
      aria-pressed={selected}
    >
      <span className={styles.chipName}>{product.name}</span>
      <span className={styles.chipPrice}>{formatMoney(product.price)}</span>
    </button>
  );
};

const SaladBuilder = ({ ingredients, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState('base');
  const [selections, setSelections] = useState({ base: [], proteina: [], complemento: [], molho: [] });

  const grouped = useMemo(() => {
    const groups = { base: [], proteina: [], complemento: [], molho: [] };
    ingredients.forEach((p) => {
      const step = inferIngredientStep(p);
      if (groups[step]) groups[step].push(p);
    });
    return groups;
  }, [ingredients]);

  const total = useMemo(() => {
    return Object.values(selections)
      .flat()
      .reduce((sum, p) => sum + Number(p.price || 0), 0);
  }, [selections]);

  const selectedCount = Object.values(selections).flat().length;
  const isValid = selections.base.length > 0 && selections.molho.length > 0;

  const toggleItem = useCallback((step, product) => {
    setSelections((prev) => {
      const current = prev[step];
      const stepConfig = STEPS.find((s) => s.key === step);
      const isSelected = current.some((p) => p.id === product.id);

      if (isSelected) {
        return { ...prev, [step]: current.filter((p) => p.id !== product.id) };
      }

      if (stepConfig.max === 1) {
        // Radio behavior for single-select steps
        return { ...prev, [step]: [product] };
      }

      if (current.length < stepConfig.max) {
        return { ...prev, [step]: [...current, product] };
      }
      return prev;
    });
  }, []);

  const handleAddToCart = () => {
    const allItems = Object.values(selections).flat();
    if (!isValid || allItems.length === 0) return;
    allItems.forEach((item) => onAddToCart?.(item));
    setSelections({ base: [], proteina: [], complemento: [], molho: [] });
    setIsOpen(false);
  };

  const hasIngredients = ingredients.length > 0;

  return (
    <div className={styles.wrapper}>
      {/* Builder CTA card */}
      <button
        type="button"
        className={styles.cta}
        onClick={() => setIsOpen((v) => !v)}
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
        <span className={`${styles.ctaArrow} ${isOpen ? styles.ctaArrowOpen : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Builder panel */}
      {isOpen && hasIngredients && (
        <div className={styles.panel}>
          {/* Step tabs */}
          <div className={styles.stepTabs}>
            {STEPS.map((step, i) => {
              const count = selections[step.key].length;
              const done = step.required ? count > 0 : true;
              return (
                <button
                  key={step.key}
                  type="button"
                  className={`${styles.stepTab} ${activeStep === step.key ? styles.stepTabActive : ''} ${done && count > 0 ? styles.stepTabDone : ''}`}
                  onClick={() => setActiveStep(step.key)}
                >
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <span className={styles.stepEmoji} aria-hidden="true">{step.emoji}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {count > 0 && <span className={styles.stepBadge}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Active step content */}
          {STEPS.map((step) => {
            if (step.key !== activeStep) return null;
            const items = grouped[step.key];
            const count = selections[step.key].length;
            return (
              <div key={step.key} className={styles.stepContent}>
                <p className={styles.stepHint}>
                  {step.hint}
                  {step.required && <span className={styles.required}> • obrigatório</span>}
                </p>
                {items.length === 0 ? (
                  <p className={styles.emptyStep}>Nenhum ingrediente nessa categoria ainda.</p>
                ) : (
                  <div className={styles.chips}>
                    {items.map((product) => (
                      <IngredientChip
                        key={product.id}
                        product={product}
                        selected={selections[step.key].some((p) => p.id === product.id)}
                        onToggle={(p) => toggleItem(step.key, p)}
                        max={step.max}
                        stepCount={count}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary + CTA */}
          <div className={styles.summary}>
            <div className={styles.summaryLeft}>
              <span className={styles.summaryCount}>
                {selectedCount > 0 ? `${selectedCount} ingrediente(s)` : 'Nenhum ingrediente'}
              </span>
              {total > 0 && (
                <span className={styles.summaryTotal}>{formatMoney(total)}</span>
              )}
            </div>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleAddToCart}
              disabled={!isValid}
            >
              {isValid ? 'Adicionar à sacola' : 'Escolha base e molho'}
            </button>
          </div>
        </div>
      )}

      {isOpen && !hasIngredients && (
        <div className={styles.panelEmpty}>
          <span aria-hidden="true">🌱</span>
          <p>Em breve, ingredientes individuais estarão disponíveis para montagem livre.</p>
          <p>Por enquanto, experimente nossos combos prontos abaixo!</p>
        </div>
      )}
    </div>
  );
};

export default SaladBuilder;
