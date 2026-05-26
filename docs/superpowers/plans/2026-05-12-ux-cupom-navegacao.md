# UX Cupom + Navegação do Cardápio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expor o campo de cupom no passo 1 do checkout (OrderConfirmation) e destacar visualmente os cabeçalhos de seção do cardápio com ícone SVG + borda esquerda laranja.

**Architecture:** Feature 1 passa as props do `useCoupon` (já instanciado no `CheckoutPage`) para o `OrderConfirmation`, adicionando `CouponInput` antes do total. Feature 2 adiciona um campo `icon` ao array `MENU_SECTIONS` e envolve o `<h2>` de cada seção num wrapper flex com `border-left`. Sem novos hooks, sem novos componentes.

**Tech Stack:** React 19, Next.js 15, lucide-react (já instalado), CSS Modules + classes globais em `Cardapio.css`

---

## Arquivos tocados

| Arquivo | O que muda |
|---|---|
| `src/components/checkout/CouponInput.jsx` | Adiciona prop `placeholder` |
| `src/components/checkout/OrderConfirmation.jsx` | Recebe props de cupom, renderiza `CouponInput` |
| `src/styles/CheckoutModal.module.css` | Adiciona `.couponSection` |
| `src/pages/CheckoutPage.jsx` | Passa `coupon` + `onApplyCoupon` para `OrderConfirmation` |
| `src/components/checkout/PaymentStep.jsx` | Esconde formulário de cupom se não aplicado |
| `src/pages/Cardapio.jsx` | Importa ícones Lucide, adiciona `icon` ao `MENU_SECTIONS`, atualiza render do header |
| `src/pages/Cardapio.css` | Adiciona `.catalog-section__title-row` e `.catalog-section__title-icon` |

---

## Task 1: Prop `placeholder` no CouponInput

**Files:**
- Modify: `src/components/checkout/CouponInput.jsx`

- [ ] **Adicionar `placeholder` na destructuring de props (linha ~7)**

```jsx
const CouponInput = ({
  couponCode,
  couponError,
  appliedCoupon,
  loadingCoupon,
  onChange,
  onApply,
  onRemove,
  disabled = false,
  placeholder = 'Digite o código',
}) => {
```

- [ ] **Passar `placeholder` para o `<input>` (linha ~55)**

Troca `placeholder="Digite o código"` por:
```jsx
placeholder={placeholder}
```

- [ ] **Verificar que o componente ainda funciona sem quebras**

```bash
cd /home/graco/WORK/ce-saladas && npm run build 2>&1 | tail -20
```
Esperado: sem erros TypeScript/ESLint relacionados ao CouponInput.

- [ ] **Commit**

```bash
git add src/components/checkout/CouponInput.jsx
git commit -m "feat: adiciona prop placeholder ao CouponInput"
```

---

## Task 2: CSS — `.couponSection` no CheckoutModal.module.css

**Files:**
- Modify: `src/styles/CheckoutModal.module.css`

- [ ] **Adicionar classe ao final do arquivo**

```css
.couponSection {
  margin: 12px 0;
  padding: 14px;
  background: #fff7ed;
  border: 1px solid rgba(249, 115, 22, 0.22);
  border-radius: 8px;
}
```

- [ ] **Commit**

```bash
git add src/styles/CheckoutModal.module.css
git commit -m "feat: adiciona estilo couponSection ao checkout"
```

---

## Task 3: Cupom no OrderConfirmation

**Files:**
- Modify: `src/components/checkout/OrderConfirmation.jsx`

- [ ] **Adicionar import do CouponInput (após os imports existentes, linha ~4)**

```jsx
import CouponInput from './CouponInput';
```

- [ ] **Adicionar props de cupom na assinatura do componente (linha ~6)**

```jsx
const OrderConfirmation = ({
  cart,
  combos = [],
  cartTotal,
  shippingMethod,
  onShippingMethodChange,
  deliveryInfo,
  onSelectDeliveryAddress,
  confirmedAddress,
  onProceedToPayment,
  coupon,
  onApplyCoupon,
}) => {
```

- [ ] **Renderizar `CouponInput` entre `.orderTotal` e o botão proceed (linha ~213)**

Inserir entre o fechamento de `<div className={styles.orderTotal}>` (linha ~213) e o `<button className={styles.proceedButton}` (linha ~215):

```jsx
      {coupon && (
        <div className={styles.couponSection}>
          <CouponInput
            couponCode={coupon.couponCode}
            couponError={coupon.couponError}
            appliedCoupon={coupon.appliedCoupon}
            loadingCoupon={coupon.loadingCoupon}
            onChange={coupon.handleCouponChange}
            onApply={onApplyCoupon}
            onRemove={coupon.removeCoupon}
            placeholder="DIGITE O CUPOM"
          />
        </div>
      )}
```

- [ ] **Commit**

```bash
git add src/components/checkout/OrderConfirmation.jsx
git commit -m "feat: exibe cupom de desconto no passo 1 do checkout"
```

---

## Task 4: Passar props de cupom do CheckoutPage para OrderConfirmation

**Files:**
- Modify: `src/pages/CheckoutPage.jsx`

- [ ] **Adicionar `coupon` e `onApplyCoupon` ao render do `OrderConfirmation` (linha ~664)**

```jsx
<OrderConfirmation
  cart={cart}
  combos={combos}
  cartTotal={cartTotal}
  shippingMethod={delivery.shippingMethod}
  onShippingMethodChange={handleShippingMethodChange}
  deliveryInfo={delivery.deliveryInfo}
  onSelectDeliveryAddress={handleSelectDeliveryAddress}
  confirmedAddress={confirmedAddress}
  onProceedToPayment={handleProceedToPayment}
  coupon={coupon}
  onApplyCoupon={handleApplyCoupon}
/>
```

- [ ] **Verificar visualmente**

```bash
cd /home/graco/WORK/ce-saladas && npm run dev
```

Abrir `http://localhost:3000/cardapio`, adicionar item, ir ao checkout. No passo "Confirmar pedido", o campo "Tem um cupom de desconto?" com placeholder `DIGITE O CUPOM` deve aparecer antes do botão "Continuar".

- [ ] **Commit**

```bash
git add src/pages/CheckoutPage.jsx
git commit -m "feat: conecta useCoupon ao OrderConfirmation"
```

---

## Task 5: Ocultar formulário de cupom no PaymentStep quando não aplicado

**Files:**
- Modify: `src/components/checkout/PaymentStep.jsx`

- [ ] **Condicionar o bloco de CouponInput a `coupon.appliedCoupon` (linhas ~83-94)**

Troca:
```jsx
          <div className={styles.stepSection}>
            <CouponInput
              couponCode={coupon.couponCode}
              couponError={coupon.couponError}
              appliedCoupon={coupon.appliedCoupon}
              loadingCoupon={coupon.loadingCoupon}
              onChange={coupon.handleCouponChange}
              onApply={onApplyCoupon}
              onRemove={coupon.removeCoupon}
              disabled={loading}
            />
          </div>
```

Por:
```jsx
          {coupon.appliedCoupon && (
            <div className={styles.stepSection}>
              <CouponInput
                couponCode={coupon.couponCode}
                couponError={coupon.couponError}
                appliedCoupon={coupon.appliedCoupon}
                loadingCoupon={coupon.loadingCoupon}
                onChange={coupon.handleCouponChange}
                onApply={onApplyCoupon}
                onRemove={coupon.removeCoupon}
                disabled={loading}
              />
            </div>
          )}
```

- [ ] **Verificar: se cupom foi aplicado no passo 1, o badge aparece no passo 3; se não foi aplicado, o formulário não aparece no passo 3**

```bash
npm run dev
```

- [ ] **Commit**

```bash
git add src/components/checkout/PaymentStep.jsx
git commit -m "feat: esconde formulário de cupom no PaymentStep quando não aplicado"
```

---

## Task 6: Ícones Lucide nos cabeçalhos de seção do Cardápio

**Files:**
- Modify: `src/pages/Cardapio.jsx`
- Modify: `src/pages/Cardapio.css`

- [ ] **Ampliar import do lucide-react (linha ~5 do Cardapio.jsx)**

```jsx
import { Clock3, MapPin, ShoppingBag, Star, ChefHat, Leaf, Droplets, GlassWater } from 'lucide-react';
```

- [ ] **Adicionar campo `icon` ao array `MENU_SECTIONS` (linhas 25-56)**

```jsx
const MENU_SECTIONS = [
  {
    key: 'destaques',
    title: 'Destaques',
    description: 'Favoritos da casa e escolhas certeiras para começar.',
    featuredOnly: true,
    icon: Star,
  },
  {
    key: 'monte-sua-salada',
    title: 'Monte sua Salada',
    description: 'Monte do zero ou escolha um combo pronto — do seu jeito.',
    isBuilder: true,
    icon: ChefHat,
  },
  {
    key: 'saladas',
    title: 'Saladas',
    description: 'Combinações frescas para almoço, jantar ou uma pausa leve no dia.',
    icon: Leaf,
  },
  {
    key: 'molhos',
    title: 'Molhos',
    description: 'Complementos para ajustar o sabor e finalizar o pedido do seu jeito.',
    icon: Droplets,
  },
  {
    key: 'bebidas',
    title: 'Bebidas',
    description: 'Para acompanhar sua salada.',
    icon: GlassWater,
  },
];
```

- [ ] **Atualizar render do header de seção (linhas ~539-549)**

Troca o bloco atual:
```jsx
                    <div className="catalog-section__header">
                      <div>
                        <h2 className="catalog-section__title">{section.title}</h2>
                        <p className="catalog-section__description">{section.description}</p>
                      </div>
                      {!section.featuredOnly && !section.isBuilder && section.items.length > 0 && (
                        <span className="catalog-section__count">
                          {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      )}
                    </div>
```

Por:
```jsx
                    <div className="catalog-section__header">
                      <div>
                        <div className="catalog-section__title-row">
                          {section.icon && <section.icon size={16} className="catalog-section__title-icon" />}
                          <h2 className="catalog-section__title">{section.title}</h2>
                        </div>
                        <p className="catalog-section__description">{section.description}</p>
                      </div>
                      {!section.featuredOnly && !section.isBuilder && section.items.length > 0 && (
                        <span className="catalog-section__count">
                          {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      )}
                    </div>
```

- [ ] **Adicionar CSS ao final de `src/pages/Cardapio.css`**

```css
.catalog-section__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 3px solid var(--color-primary);
  padding-left: 10px;
}

.catalog-section__title-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}
```

- [ ] **Verificar visualmente — cada seção do cardápio deve ter ícone + borda esquerda laranja, sem alterar a rolagem**

```bash
npm run dev
```

Abrir `http://localhost:3000/cardapio` e rolar por todas as seções.

- [ ] **Commit**

```bash
git add src/pages/Cardapio.jsx src/pages/Cardapio.css
git commit -m "feat: adiciona ícone e destaque visual aos cabeçalhos de seção do cardápio"
```
