# Cê Saladas Storyboard

**Format:** 1080x1920
**Audio:** locução curta + trilha leve percussiva + SFX sutis de swipe/click
**VO direction:** voz confiante, calorosa, fala natural de anúncio local premium; sem locução de varejão
**Style basis:** [DESIGN.md](/home/graco/WORK/ce-saladas/docs/video-ad/DESIGN.md)

## Global Direction

- Mostrar bowl/produto no primeiro segundo.
- Máximo de dois beats com UI dominante; o resto precisa equilibrar comida, texto e prova.
- Misturar 3 linguagens ao longo do vídeo: editorial food ad, UI demo e CTA de performance.
- Motion visível: nada de imagens paradas ou fades secos.
- O CTA final precisa apontar para o cardápio/site, não para WhatsApp.

## Asset Audit

| Asset/Source | Type | Assign to Beat | Role |
| --- | --- | --- | --- |
| `public/dishes/bowl-shrimp.webp` | Hero dish | Beat 1, Beat 4 | Produto principal com apetite visual |
| `LandingPage hero` | UI state | Beat 1, Beat 2 | Contexto da marca e prova de frescor |
| `Brand strip benefits` | Content pattern | Beat 2 | Diferenciais em cascata |
| `How it works` steps | Content pattern | Beat 3 | Explicar fluxo em 3 movimentos |
| `Cardapio hero + sections` | UI state | Beat 3, Beat 4 | Mostrar navegação real do site |
| `Checkout flow` | UI state | Beat 4 | Validar que o pedido termina rápido |
| `CTA section` | Content pattern | Beat 5 | Fechamento com chamada clara |

## BEAT 1 — HOOK / APETITE (0:00–0:03)

**VO cue:** "Tem dia que você só quer comer bem sem perder tempo."

**Concept:** O vídeo já começa no meio do movimento. Um bowl hero ocupa o centro como peça de food ad premium, enquanto a marca e os badges entram ao redor. A sensação é de frescor instantâneo com urgência leve, não de promoção gritante.

**Visual description:** Fundo creme com textura orgânica muito sutil. O bowl de camarão cresce com zoom elástico de 92% para 100%, girando poucos graus. Atrás dele, um blob laranja respira. Badge "100% fresco" desliza do topo e badge "Entrega hoje" sobe da base. O nome "Cê Saladas" entra em Fraunces com reveal por máscara e um highlight verde passa por trás da palavra principal.

**Mood direction:** editorial food campaign com energia social-first; elegante, apetitoso e rápido.

**Assets:**

- `public/dishes/bowl-shrimp.webp` como hero visual.
- referência de copy do hero da landing.

**Animation choreography:**

- Bowl PUNCHES in com scale + rotate leve.
- Blob BREATHES continuamente.
- Badges CASCADE in com stagger curto.
- Headline REVEALS por word-mask.
- Partículas sutis FLOAT ao redor como temperos/luz.

**Transition:** zoom through quente, com blur curto e expansão do bowl para preencher a tela.

**Depth layers:**

- BG: creme texturizado + glow radial.
- MG: blob orgânico laranja.
- FG: bowl, badges, headline.

**SFX cues:** soft whoosh de abertura + click leve na entrada dos badges.

## BEAT 2 — PROVA / DIFERENCIAIS (0:03–0:06)

**VO cue:** "No Cê Saladas, você monta seu pedido em poucos toques..."

**Concept:** O vídeo sai do apetite e entra na promessa. Em vez de listar benefícios como texto parado, os diferenciais passam como uma esteira viva, lembrando a brand strip do site, mas com mais densidade e impacto.

**Visual description:** Faixas horizontais se movem em velocidades diferentes com frases como "Ingredientes frescos", "Sem conservantes", "Monte sua salada", "Entrega e retirada". No centro, uma peça tipográfica em Fraunces diz "fresco e rápido". Ícones de folha, raio e estrela orbitam em órbitas curtas. O fundo alterna creme e verde-claro por parallax.

**Mood direction:** vivo, rítmico, clean e local-premium.

**Assets:**

- padrões do brand strip da landing.
- ícones e diferenciais existentes do projeto.

**Animation choreography:**

- Benefit pills MARQUEE across.
- Keyword STAMPS in com leve overshoot.
- Ícones ORBIT em microtrajetórias.
- Counters e estrelas PULSE once.

**Transition:** whip pan vertical para simular rolagem do site.

**Depth layers:**

- BG: blocos em leaf e sand.
- MG: trilhas de pills.
- FG: headline central e ícones.

**SFX cues:** ticks leves e um sweep contínuo de velocidade.

## BEAT 3 — CARDÁPIO / ESCOLHA (0:06–0:10)

**VO cue:** "...escolhe ingredientes frescos..."

**Concept:** Agora o site aparece como ferramenta real de compra. O usuário precisa entender em menos de 4 segundos que existe um cardápio claro, itens atraentes e personalização simples.

**Visual description:** Mockup de celular central com o hero do cardápio. A câmera faz push-in enquanto chips de categorias entram pelos lados. Três cards de produtos deslizam como se fossem escolhidos um a um. Um selo "Monte sua salada" se destaca com glow verde. Na lateral, pequenos ingredientes flutuam como sistema visual, não como foto realista.

**Mood direction:** produto em uso, mas ainda com acabamento publicitário.

**Assets:**

- estado do `Cardapio` com hero, busca e seções.
- referência textual de "Destaques", "Monte sua Salada" e "Saladas".

**Animation choreography:**

- Phone mockup SLIDES up.
- Category pills SNAP into place.
- Product cards CASCADE in da direita.
- Search bar TYPES on rapidamente.
- Highlight ring DRAWS ao redor de "Monte sua Salada".

**Transition:** velocity-matched upward com blur moderado para levar ao checkout.

**Depth layers:**

- BG: gradiente sand para white.
- MG: mockup do celular e cards.
- FG: selos, anéis, ingredientes ilustrados.

**SFX cues:** tap, swipe curto e som de seleção macio.

## BEAT 4 — CHECKOUT / MENOS ATRITO (0:10–0:13)

**VO cue:** "...e finaliza no site com entrega ou retirada."

**Concept:** Esse beat responde à objeção de atrito. O checkout deve parecer curto, organizado e confiável. Não é para mostrar todos os campos; é para mostrar que a compra anda.

**Visual description:** A tela divide em três passos visuais: resumo do pedido, escolha de entrega/retirada, pagamento. Cada etapa entra em sequência sobre um trilho vertical como se fosse um fluxo rápido. Um check animado conecta os blocos. O badge "Novo fluxo" aparece pequeno como selo de eficiência.

**Mood direction:** simples, seguro e fluido.

**Assets:**

- fluxo do `CheckoutPage`.
- conteúdo do modal "Agora o pedido termina com menos atrito".

**Animation choreography:**

- Steps STACK up.
- Connector line DRAWS downward.
- Checkmarks POP in.
- Payment icons FADE and SETTLE.
- Mini CTA chip "menos atrito" GLIDES across.

**Transition:** cinematic zoom curto para o CTA final.

**Depth layers:**

- BG: dark-warm to terra gradient para aumentar contraste final.
- MG: cards do fluxo.
- FG: checkmarks, chip de CTA, brilho quente.

**SFX cues:** três confirmações leves em sequência, finalizando com chime.

## BEAT 5 — CTA / SITE (0:13–0:15)

**VO cue:** "Abre o cardápio e pede agora."

**Concept:** Fechamento direto de performance. Marca, prato e CTA convivem no mesmo quadro para não desperdiçar os últimos segundos.

**Visual description:** O bowl reaparece maior, agora parcialmente cortando a moldura. O logo/nome do Cê Saladas fica no topo. No centro, o CTA "Abra o cardápio" entra em bloco laranja com tipografia forte. A URL ou domínio curto do site aparece abaixo. Um halo verde atravessa o botão e termina com um micro bounce.

**Mood direction:** direto, desejável e clicável.

**Assets:**

- `public/dishes/bowl-shrimp.webp`
- identidade da CTA section da landing

**Animation choreography:**

- CTA button SLAMS in.
- URL FADES up com tracking aberto.
- Bowl DRIFTS lateralmente.
- Accent streak SWEEPS over the button.
- Final frame HOLDS com leve pulse.

**Transition:** fade to warm black apenas no último quadro.

**Depth layers:**

- BG: gradiente terra escuro.
- MG: bowl e glow.
- FG: botão, URL, logo.

**SFX cues:** whoosh final + pulse suave no CTA.

## Production Architecture

```text
docs/video-ad/
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
└── IMPROVEMENTS.md
```
