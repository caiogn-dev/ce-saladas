# Design: UX de Cupom + Navegação do Cardápio

**Data:** 2026-05-12  
**Foco:** Conversão para usuários 30+ — intuitividade, sem aumentar complexidade visual

---

## Contexto

O Ce-Saladas tem dois pontos de atrito para usuários 30+:

1. **Cupom de desconto** existe só no `PaymentStep` (último passo do checkout), invisível até o final do fluxo.
2. **Navegação do cardápio** usa chips de texto simples sem nenhum destaque visual entre seções — ao rolar, o usuário perde a noção de onde está.

---

## Feature 1 — Cupom no OrderConfirmation

### O que muda

O `CouponInput` aparece no **passo 1 do checkout** (`OrderConfirmation`), sempre expandido, antes do botão "Continuar".

### Posição no layout

```
[ itens do carrinho ]
[ ... ]
┌─────────────────────────────────────────┐  ← background #fff7ed
│  Tem um cupom de desconto?              │     border rgba(249,115,22,0.22)
│  [ DIGITE O CUPOM          ] [Aplicar]  │
└─────────────────────────────────────────┘
[ Total: R$ XX,XX ]
[ Continuar → ]
```

### Comportamento

- **Sempre expandido** — campo visível imediatamente, sem toggle
- Placeholder: `DIGITE O CUPOM`
- Ao aplicar com sucesso: exibe o resumo do desconto (comportamento já existente no `CouponInput`)
- `PaymentStep` **mantém** o `CouponInput` apenas no estado "aplicado" — se já foi aplicado, mostra o badge; se não, oculta o formulário (evita duplicação confusa)

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/checkout/CouponInput.jsx` | Adiciona prop `placeholder` (default: `"Digite o código"`) |
| `src/components/checkout/OrderConfirmation.jsx` | Recebe props do cupom e renderiza `<CouponInput>` |
| `src/pages/CheckoutPage.jsx` | Passa `{ couponCode, couponError, appliedCoupon, loadingCoupon, handleCouponChange, applyCoupon, removeCoupon }` para `OrderConfirmation` |
| `src/components/checkout/PaymentStep.jsx` | Esconde o formulário de cupom se já aplicado; mostra só o badge |
| `src/styles/Checkout.module.css` | Adiciona `.couponSection` — box com fundo terra-light e borda |

---

## Feature 2 — Cabeçalhos de Seção do Cardápio

### O que muda

Cada seção do cardápio ganha um cabeçalho destacado: borda esquerda laranja (`3px solid #f97316`) + ícone SVG Lucide + título em negrito. Sem subtítulo, sem emoji. Altura idêntica ao header atual, zero impacto na rolagem.

### Visual

```
│▌ [ícone] Saladas          ← border-left: 3px solid #f97316; font-weight: 700
           Salada César...   ← produtos normais
           Bowl Mediterrâneo
│▌ [ícone] Molhos
           Molho Tahine
```

Ícones via `lucide-react` (já instalado no projeto), tamanho 16px, cor `var(--color-primary)`.

### Ícones por seção

| Seção | Lucide icon |
|---|---|
| Destaques | `Star` |
| Monte sua Salada | `ChefHat` |
| Saladas | `Leaf` |
| Molhos | `Droplets` |
| Bebidas | `GlassWater` |

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/Cardapio.jsx` | Adiciona campo `icon` (componente Lucide) no array `MENU_SECTIONS`; ajusta render do header para exibir ícone + título com borda |
| `src/pages/Cardapio.css` | Adiciona `.catalog-section__title-row`: `display:flex; align-items:center; gap:8px; border-left:3px solid var(--color-primary); padding-left:10px` |

### Cupom — ícone

Label do cupom usa `<Tag size={15} />` do Lucide no lugar do emoji 🏷️.

---

## Fora de escopo

- Chips de navegação (sticky nav): sem alteração
- Hint de primeira visita: fora de escopo
- Seção "Monte sua Salada": sem banner extra — o builder já se explica visualmente
- Mobile vs desktop: ambas as mudanças são agnósticas de breakpoint

---

## Critérios de sucesso

- Usuário com cupom consegue aplicá-lo sem chegar ao PaymentStep
- Ao rolar o cardápio, cada nova seção é imediatamente identificável pelo título destacado
- Nenhuma regressão no fluxo de checkout existente
