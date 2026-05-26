# Cê Saladas — Fluxo Visual Interativo do Cardápio

## Diagnóstico Atual

O catálogo público em `https://backend.pastita.com.br/api/v1/stores/ce-saladas/catalog/` expõe 6 saladas ativas com imagem na categoria `Saladas`.

| Salada | Slug | Imagem atual | Dimensão atual |
| --- | --- | --- | --- |
| Almôndega Premium | `almondega-premium` | `https://backend.pastita.com.br/media/stores/products/almondega.webp` | 1024x682 |
| Basic Lombo | `basic-lombo` | `https://backend.pastita.com.br/media/stores/products/basic-lombo.webp` | 1024x768 |
| Especial filé de frango | `especial-file-de-frango` | `https://backend.pastita.com.br/media/stores/products/especial-frango.webp` | 1024x1283 |
| Magnífico Camarão | `magnifico-camarao` | `https://backend.pastita.com.br/media/stores/products/camar%C3%A3o.webp` | 1024x1427 |
| Queridinha | `queridinha` | `https://backend.pastita.com.br/media/stores/products/queridinha.webp` | 1024x764 |
| Tilápia Suprema | `tilapia-suprema` | `https://backend.pastita.com.br/media/stores/products/tilapia.webp` | 1024x1536 |

Observação: o pedido menciona 7 saladas, mas hoje só 6 saladas com imagem aparecem no catálogo público. A 7ª salada é a de salmão e entra no pipeline como `salmao-premium`, usando inicialmente `ce-saladas/public/dishes/bowl-salmon.webp` como fonte.

O problema principal não é falta de imagem. É falta de sistema visual: cada foto tem proporção, câmera, enquadramento e presença de prato diferentes. Para um cardápio interativo com vídeo/scroll, todas precisam virar uma família visual.

## Objetivo

Criar um sistema visual para as saladas com:

- mesma câmera;
- mesmo bowl/prato;
- mesma luz;
- mesmo fundo;
- mesma escala;
- mesma posição do alimento;
- variação clara por sabor/proteína;
- assets prontos para card, detalhe, vídeo vertical, hero e animação scroll-sync.

## Padrão Mestre

Use um "hero bowl" padronizado:

- enquadramento principal: top-down em 3/4, prato centralizado;
- fundo: claro, quente, limpo, com textura leve de bancada;
- câmera: 70mm ou 85mm look, sem distorção grande-angular;
- luz: softbox lateral superior, sombra curta e consistente;
- recipiente: mesmo bowl branco/off-white ou kraft premium;
- composição: salada ocupa 72-78% do quadro;
- espaço negativo: 10-14% nas bordas para textos/recortes;
- formato base: 2048x2048, exportado também em 1600x1600 WebP.

## Assinatura Por Sabor

Cada salada deve ter uma cor/acento visual próprio, sem quebrar o padrão.

| Salada | Protagonista | Acento visual |
| --- | --- | --- |
| Almôndega Premium | almôndegas bovinas | molho mostarda/mel + queijo |
| Basic Lombo | lombo suíno | ovo de codorna + milho/cenoura |
| Especial filé de frango | filé de frango | manga + palmito |
| Magnífico Camarão | camarão provençal | abacaxi + red hot |
| Queridinha | frango desfiado | batata palha + milho |
| Tilápia Suprema | tilápia | chips de moranga + lemon pepper |
| Salmão Premium | salmão | laranja/salmão + verdes frescos |

## Estrutura De Assets

Criar uma pasta versionada para assets derivados:

```text
public/menu-visuals/
  salads/
    almondega-premium/
      source.webp
      hero-square.webp
      card.webp
      detail.webp
      cutout.png
      loop.mp4
      scroll/
        frame-000.webp
        frame-001.webp
        ...
    basic-lombo/
    especial-file-de-frango/
    magnifico-camarao/
    queridinha/
    tilapia-suprema/
```

Não substituir imediatamente as imagens oficiais do backend. Primeiro gerar os derivados no frontend, validar conversão e depois decidir se o backend passa a apontar para as imagens novas.

## Fluxo Higgsfield

### 1. Padronização Das Fotos

Use `higgsfield-product-photoshoot` no modo `restyle` para transformar cada foto real numa foto padronizada mantendo a identidade da salada.

Comando base:

```bash
higgsfield product-photoshoot create \
  --mode restyle \
  --image <arquivo-local-da-salada.webp> \
  --count 3 \
  --aspect_ratio 1:1 \
  --prompt "padronizar foto de salada Cê Saladas em bowl premium, top-down 3/4, fundo claro, luz natural comercial, mesma escala e enquadramento, manter ingredientes e proteína reconhecíveis"
```

Rodar por salada, escolher uma vencedora e salvar como:

```text
public/menu-visuals/salads/<slug>/hero-square.webp
```

### 2. Variações Estáticas

Para cada salada, gerar 3 variações:

- `card`: foto limpa para cardápio;
- `detail`: foto mais próxima para modal/detalhe;
- `promo`: foto com mais espaço negativo para campanha.

Comando base:

```bash
higgsfield product-photoshoot create \
  --mode product_shot \
  --image <hero-square-ou-source.webp> \
  --count 3 \
  --aspect_ratio 1:1 \
  --prompt "salada autoral Cê Saladas, foto de produto premium para cardápio digital, manter ingredientes originais, mesma direção de luz, mesmo bowl, fundo claro, aparência fresca e real"
```

### 3. Vídeo Curto Por Salada

Para vídeos, usar `higgsfield-generate` com `seedance_2_0` ou `kling3_0`, partindo da imagem padronizada.

Uso recomendado:

- vertical `9:16` para Reels/Stories;
- quadrado `1:1` para cards animados;
- duração 4-6s por salada;
- movimento sutil: câmera orbitando, ingredientes com micro movimento, molho brilhando.

Comando base:

```bash
higgsfield generate create seedance_2_0 \
  --start-image public/menu-visuals/salads/<slug>/hero-square.webp \
  --prompt "slow premium food camera orbit, fresh salad bowl, subtle ingredient motion, appetizing commercial lighting, no text, no hands, no deformation, keep the same salad identity" \
  --duration 5 \
  --aspect_ratio 1:1 \
  --wait \
  --wait-timeout 20m
```

### 4. Scroll-Sync No Site

Para site, não depender primeiro de vídeo pesado. A melhor arquitetura é em camadas:

1. `image sequence`: 40-80 frames WebP para scroll-sync preciso.
2. `video fallback`: MP4/WebM leve se o dispositivo for fraco.
3. `static fallback`: `hero-square.webp` para `prefers-reduced-motion`.

Fluxo:

```text
Higgsfield video -> ffmpeg extrai frames -> WebP otimizado -> componente React controla frame pelo scroll.
```

Comando para extrair frames:

```bash
ffmpeg -i loop.mp4 -vf "fps=12,scale=1200:-1" public/menu-visuals/salads/<slug>/scroll/frame-%03d.webp
```

## Frontend Proposto

### Novo Manifesto Visual

Criar:

```text
src/data/saladVisuals.js
```

Formato:

```js
export const SALAD_VISUALS = {
  'almondega-premium': {
    accent: '#B35A34',
    hero: '/menu-visuals/salads/almondega-premium/hero-square.webp',
    card: '/menu-visuals/salads/almondega-premium/card.webp',
    detail: '/menu-visuals/salads/almondega-premium/detail.webp',
    video: '/menu-visuals/salads/almondega-premium/loop.mp4',
    scrollFrames: {
      base: '/menu-visuals/salads/almondega-premium/scroll/frame-',
      count: 60,
      ext: 'webp',
    },
  },
};
```

### Componentes

Criar:

```text
src/components/menu/SaladVisualStage.jsx
src/components/menu/SaladScrollSequence.jsx
src/components/menu/InteractiveMenuSection.jsx
```

Responsabilidades:

- `SaladVisualStage`: exibe salada ativa, nome, preço e CTA sem parecer card comum.
- `SaladScrollSequence`: troca frames conforme scroll.
- `InteractiveMenuSection`: lista saladas como trilha lateral/abas e troca visual ativa.

### Comportamento

Desktop:

- coluna esquerda: lista compacta das saladas;
- centro/direita: bowl grande animado;
- scroll vertical muda a salada ativa;
- ao entrar em uma salada, roda a sequência/loop dela;
- botão fixo "Adicionar" usa o produto real do catálogo.

Mobile:

- cards continuam como fallback funcional;
- uma seção acima dos cards mostra a salada ativa em swipe/scroll horizontal;
- animação reduzida: vídeo curto ou só crossfade entre imagens.

## Caminho 2D Vs 3D

### Caminho 2D Recomendado Agora

Mais rápido, bonito e seguro:

- fotos padronizadas;
- cutouts PNG;
- sombra CSS/canvas;
- parallax leve;
- scroll-synced frame sequence.

Vantagem: entra no site rápido e mantém aparência real da comida.

### Caminho 3D Depois

Fazer 3D real das saladas é bem mais caro porque comida orgânica é difícil de modelar. Melhor fazer um "fake 3D":

- bowl 3D simples em Three.js;
- ingredientes em camadas PNG/cutout;
- rotação/parallax por profundidade;
- molho/ingredientes como sprites;
- não tentar modelar cada tomate/couve realisticamente no início.

Quando fizer sentido:

- hero da home;
- experiência especial "monte sua salada";
- campanha visual, não fluxo principal de compra.

## Ordem De Execução

1. Confirmar a 7ª salada no backend.
2. Baixar as 6/7 imagens oficiais do `main_image_url`.
3. Rodar padronização `restyle` no Higgsfield, 3 variações por salada.
4. Escolher 1 imagem vencedora por salada.
5. Gerar `card`, `detail`, `promo` e `cutout`.
6. Gerar vídeo curto de 4-6s por salada.
7. Extrair frames WebP para scroll-sync.
8. Criar `SALAD_VISUALS`.
9. Criar seção interativa no `/cardapio`.
10. Manter cards antigos como fallback e para compra direta.

## Critério De Qualidade

Rejeitar uma geração se:

- trocar ingredientes principais;
- mudar a proteína;
- inventar embalagem/logo;
- colocar texto dentro da imagem;
- cortar o bowl;
- mudar demais o prato entre saladas;
- parecer ilustração quando a intenção for foto;
- criar alimento visualmente impossível.

O objetivo é que o cliente reconheça a salada e sinta que o cardápio é premium, não que cada sabor vire uma imagem aleatória de IA.
