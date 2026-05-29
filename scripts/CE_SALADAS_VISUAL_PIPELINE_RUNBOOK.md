# Cê Saladas Visual Pipeline Local

Gera imagens padronizadas para as 7 saladas a partir das fotos reais em:

```text
/home/graco/ftp-data/cardapio-cesaladas/ce-saladas/
```

O script não usa imagens da Pastita nem da Kero Kero.

## Saídas

Para cada salada, gera:

- `source.webp`: cópia otimizada da foto real.
- `hero-square.webp`: 2048x2048 para destaque.
- `card.webp`: 1024x1024 para lista/grid.
- `detail.webp`: 2048x2048 mais fechado para modal.
- `slide-wide.webp`: 2560x1440 para cardápio em slide desktop.
- `slide-vertical.webp`: 1440x2560 para slide mobile/reels.

## Rodar

Dry-run:

```bash
node scripts/ce-saladas-visual-pipeline.mjs --dry-run
```

Gerar tudo:

```bash
node scripts/ce-saladas-visual-pipeline.mjs
```

Gerar uma salada:

```bash
node scripts/ce-saladas-visual-pipeline.mjs --slug=salmao-premium
```

Gerar só um formato:

```bash
node scripts/ce-saladas-visual-pipeline.mjs --variant=slide-wide
```

Gerar um formato de uma salada:

```bash
node scripts/ce-saladas-visual-pipeline.mjs --slug=tilapia-suprema --variant=slide-vertical
```

## Destino

```text
public/menu-visuals/salads/<slug>/
```

O manifesto visual fica em:

```text
src/data/saladVisuals.js
```
