#!/usr/bin/env bash
# scripts/preparar-video.sh
#
# Prepara um vídeo pra ser dirigido por scroll.
#
# O ponto crítico é o intervalo entre keyframes (`-g`). Cada
# `video.currentTime = x` obriga o decodificador a reconstruir a imagem a partir
# do keyframe anterior — e o vídeo entregue tinha UM keyframe em 240 frames, o
# que faz o scroll travar por completo.
#
# A primeira versão foi ao extremo oposto (`-g 1`: todo frame é keyframe) e
# custou caro: 5,8 MB, tempo de buffer longo, e enquanto o arquivo baixava os
# seeks caíam fora do buffer — o vídeo só reagia quando o download terminava,
# muito depois do ponto do scroll onde deveria ter começado.
#
# GOP de 12 (meio segundo) é o equilíbrio: um seek decodifica no máximo 12
# quadros de 720p, o que é instantâneo, e o arquivo cai pra 2,8 MB COM mais
# qualidade (crf 24 contra 26).
#
# Uso: ./scripts/preparar-video.sh /caminho/do/video-cru.mp4

set -euo pipefail

ORIGEM="${1:?uso: $0 <video-cru.mp4>}"
DESTINO="public/video/camarao-salada.mp4"
POSTER="public/video/camarao-salada-poster.jpg"

mkdir -p public/video

# 720×1280 é a resolução nativa do original — não faz sentido subir, e descer
# custaria nitidez no celular, onde o vídeo ocupa a tela inteira.
#
# 24 fps (era 12). A conta de 12 parecia boa no papel — "quem controla o tempo é
# o dedo" — mas na prática o palco tem ~340vh de pista e o dedo percorre isso
# em poucos segundos: com 120 quadros dava pra contar os degraus. 24 fps são os
# mesmos quadros do arquivo original, então o movimento volta a ser contínuo.
#
# Medido: 2,8 MB. Conexão lenta ou saveData nem baixa isso — cai no modo loop.
#
# ⚠️ Mudou o fps aqui? Atualize FPS em src/components/landing/VideoStage.jsx —
# é ele que define a grade onde os seeks são encaixados.
ffmpeg -y -i "$ORIGEM" \
  -an \
  -vf "scale=720:-2,fps=24" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 12 -keyint_min 12 -sc_threshold 0 \
  -crf 24 -preset slow \
  -movflags +faststart \
  "$DESTINO"

# Poster = primeiro frame. É o que aparece antes de carregar e o fallback
# permanente sob reduced-motion.
ffmpeg -y -i "$DESTINO" -frames:v 1 -q:v 3 "$POSTER"

echo "pronto:"
ls -lh "$DESTINO" "$POSTER"
