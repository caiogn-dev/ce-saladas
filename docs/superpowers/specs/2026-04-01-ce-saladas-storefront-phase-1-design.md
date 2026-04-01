# Ce Saladas Storefront Phase 1 Design

Date: 2026-04-01
Project: `ce-saladas`
Status: Proposed and validated in brainstorming

## 1. Context

`ce-saladas` already has a usable backend and a storefront with landing page, menu, cart, checkout, profile, and orders. The current storefront does not yet behave like a focused conversion product. The main issues are:

- the landing page is visually dense and effect-heavy, but does not push the user quickly into the menu
- the mobile journey is not the clear baseline for layout, hierarchy, touch interaction, and form behavior
- cart, authentication, and checkout continuity are fragile because responsibilities are spread across large UI files, large contexts, and a single oversized API service
- authenticated features such as profile, addresses, and orders exist, but they do not yet feel like a coherent extension of the buying journey
- WhatsApp is already part of authentication, but it is not yet treated as the central user journey channel

This phase focuses on the storefront experience only. The existing backend is reused as the primary platform. Broad server refactors and dashboard redesign are intentionally deferred.

## 2. Product Goal

Turn `ce-saladas` into a mobile-first storefront that increases completed mobile orders, strengthens premium brand perception, and creates a better return path through WhatsApp.

Primary outcomes:

- increase completed orders on mobile
- improve perceived trust and quality of the brand
- create a stronger repeat-purchase loop through WhatsApp

## 3. Scope

### In scope

- redesign the storefront journey around `home -> menu -> cart -> WhatsApp auth -> checkout -> post-order`
- rebuild the landing page as a conversion surface that pushes the user into the menu quickly
- improve the menu as the primary shopping surface, especially on mobile
- simplify cart and checkout flow
- require fast WhatsApp authentication before payment, without turning it into a heavy registration flow
- update authenticated continuity so profile, saved addresses, and order history support the shopping journey
- improve post-order and reorder entry points
- clean broken, fragile, poorly structured, or obviously low-quality storefront code that directly affects this journey
- improve UI consistency, responsiveness, perceived polish, and mobile usability across iPhone and Android

### Out of scope

- major architectural refactor of the Django backend
- full Meta API operational rollout, templates, and dashboard operations
- full redesign of `pastita-dash`
- unrelated frontend cleanup outside the storefront journey

## 4. Non-Negotiable Product Principles

### Mobile-first

The best version of the product must be the mobile version. Desktop is an expansion of the mobile experience, not the design baseline.

This means:

- layouts are designed for touch, thumb reach, and small-screen reading first
- primary actions remain visible or easy to recover during the journey
- no important interaction depends on hover or desktop-only affordances
- forms must behave well with mobile keyboards, autofill, and narrow screens
- layouts must behave reliably on iPhone Safari and Android Chrome
- responsiveness is defined by flow behavior and content hierarchy, not only CSS breakpoints

### Quality-first

Quality is part of the scope, not a final polish pass.

This means:

- remove fragile or confusing UI behavior that hurts the buying journey
- reduce visual inconsistency and duplicated UI patterns
- improve structure in code that is directly blocking product reliability
- prefer clear, maintainable boundaries over clever but tangled implementations
- do not ship a nicer landing page on top of a still-confusing cart and checkout

### WhatsApp-first continuity

WhatsApp is the central continuity channel for this product. It is not only a support add-on.

This means:

- WhatsApp login is the preferred auth gate before payment
- the customer can return to the journey through WhatsApp after the order
- order status and support entry points should reinforce WhatsApp as a trusted return path

## 5. UX Strategy

### Home

The home page must stop behaving like a showcase and start behaving like a high-conviction entry point into the menu.

Requirements:

- hero with clear value proposition and one unambiguous primary CTA to `/cardapio`
- concise proof of quality, trust, speed, freshness, and delivery/availability
- reduced motion and lighter visual effects by default, especially on mobile
- premium visual direction without sacrificing speed or clarity
- no visual element should compete with the primary purchase path

### Menu

The menu becomes the product core.

Requirements:

- mobile-first hierarchy with fast scanability
- clearer section navigation, search, and featured items
- strong emphasis on best sellers, combos, and quick decision paths
- persistent access to cart state and next-step context
- better readability, spacing, and interaction density on small screens
- smoother path between browsing, item detail, and add-to-cart

### Cart

The cart must behave as a clear decision checkpoint, not a technical sidebar.

Requirements:

- readable item summary, price clarity, and obvious edit controls
- clear total and next action
- better mobile ergonomics and visual hierarchy
- resilient continuity between guest cart and authenticated cart

### Checkout

Checkout becomes a short progression:

1. review order and choose delivery or pickup
2. authenticate with WhatsApp
3. confirm minimal customer and delivery data
4. pay

Requirements:

- reduce perceived complexity
- preserve cart and form context during auth
- reinforce trust around payment and order confirmation
- prefer progress clarity over long-form layout

### Profile, Orders, and Reorder

Authenticated pages must support repeat purchase instead of feeling detached from the storefront.

Requirements:

- profile and saved address flows should help checkout move faster next time
- order history should make status and reorder easy to find
- post-order should create a clear bridge back into WhatsApp and future purchases

## 6. Information Architecture

The storefront phase 1 is organized around four main surfaces:

- `Home`: short, conversion-led introduction to the store
- `Cardapio`: primary shopping surface
- `Sacola/Checkout`: order review, auth, delivery choice, and payment
- `Area do cliente`: profile, addresses, orders, and reorder

Navigation principle:

- the user should always know the next best action
- the path to the menu must be obvious from home
- the path to checkout must be obvious from the cart
- the path back to status, support, and reorder must be obvious after purchase

## 7. Technical Design

The backend remains in place. This phase restructures the storefront around clearer boundaries.

### Page layer

Pages such as `LandingPage`, `Cardapio`, `CheckoutPage`, and `Profile` should primarily orchestrate sections and page-level state. They should stop accumulating deep business logic, heavy animation logic, and mixed responsibilities.

### Experience layer

Journey-specific UI components should be extracted and organized around the storefront flow:

- landing sections
- menu navigation and menu presentation
- cart experience
- WhatsApp auth gate
- checkout steps
- post-order and reorder surfaces
- customer account surfaces

### Domain/state layer

State should be narrowed into clearer concerns:

- store session
- auth session
- cart session
- checkout session
- customer profile and order session

Contexts and hooks should stop acting like a hidden application backend.

### Infrastructure layer

The current oversized API service should be split by domain, for example:

- `storefrontApi`
- `authApi`
- `cartApi`
- `checkoutApi`
- `ordersApi`

Responsibilities:

- transport and request concerns stay in API modules
- business decisions stay in domain hooks/context
- rendering and interaction stay in page/component code

## 8. Data Flow

### Browse flow

- server-render store and catalog entry data where it improves perceived speed
- hydrate storefront state without heavy client bootstrap cost
- keep home and menu resilient when auth is absent

### Cart flow

- support guest cart as default browsing state
- preserve cart when user authenticates
- keep cart mutations predictable and recoverable

### Auth flow

- use WhatsApp as the preferred pre-payment authentication step
- after successful verification, refresh profile, addresses, and cart state
- do not force a long registration process

### Checkout flow

- order review and delivery choice happen before payment
- delivery state, guest state, and auth state should not fight each other
- payment starts only after the storefront has a coherent customer/session state

### Post-order flow

- confirmation page must clearly communicate success, status, and next actions
- the user should be able to continue through WhatsApp, view orders, or reorder

## 9. Meta API / WhatsApp Boundary for Phase 1

Phase 1 does not attempt to complete the entire Meta API operational design. It only includes the storefront surfaces that depend on WhatsApp continuity.

Included in phase 1:

- reliable WhatsApp login in the storefront journey
- storefront hooks for status, support entry, and return-to-journey behavior
- post-order reentry patterns that make WhatsApp useful for the customer

Deferred to later phase:

- deeper Meta API automation orchestration
- dashboard controls for templates, operations, campaigns, or advanced support workflows
- broad backend/dashboard redesign around Meta operations

## 10. Quality Requirements

The storefront phase 1 must improve both product quality and code quality in the touched area.

Required improvements:

- remove broken or clearly inconsistent UI behavior in the storefront journey
- reduce oversized page/component responsibilities where they block maintainability
- reduce CSS and interaction complexity where it harms performance or clarity
- improve consistency of buttons, cards, spacing, states, and feedback patterns
- improve accessibility basics for touch targets, readable hierarchy, and interaction feedback
- improve perceived loading and responsiveness on mobile

## 11. Acceptance Criteria

The phase is successful when all of the following are true:

- the mobile experience is clearly the strongest version of the storefront
- the landing page leads users into the menu with minimal ambiguity
- the menu is easier to browse, search, and buy from on iPhone and Android
- the cart is clearer and more reliable
- the checkout flow feels shorter and preserves state correctly
- WhatsApp authentication works as a natural pre-payment step
- authenticated users can use profile, addresses, and orders without breaking the buying flow
- post-order status and reorder paths are clear
- the touched storefront code is meaningfully cleaner and less fragile than before

## 12. Validation Plan

Minimum validation for this phase:

- smoke test `home -> cardapio -> sacola -> checkout`
- verify guest cart survives transition into authenticated state
- verify WhatsApp auth preserves the purchase journey
- verify profile, addresses, and orders work for authenticated users
- verify post-order return path is clear
- verify responsive behavior on iPhone-like and Android-like mobile widths
- verify no major regression in desktop usability

## 13. Delivery Sequence After This Spec

Implementation should be planned in this order:

1. storefront foundations and design system cleanup in touched surfaces
2. landing page conversion rebuild
3. menu and cart mobile-first rebuild
4. checkout and WhatsApp auth gate stabilization
5. profile, orders, post-order, and reorder continuity
6. follow-up phase for Meta API operations and later dashboard improvements
