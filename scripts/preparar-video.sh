#!/usr/bin/env bash
# scripts/preparar-video.sh
#
# Prepara um vídeo pra ser dirigido por scroll.
#
# O ponto crítico é `-g 1 -keyint_min 1 -sc_threshold 0`: força TODO frame a ser
# keyframe. Sem isso, cada `video.currentTime = x` obriga o decoder a reconstruir
# a partir do keyframe anterior — e o vídeo entregue tinha UM keyframe em 240
# frames, o que faria o scroll travar por completo.
#
# Uso: ./scripts/preparar-video.sh /caminho/do/video-cru.mp4

set -euo pipefail

ORIGEM="${1:?uso: $0 <video-cru.mp4>}"
DESTINO="public/video/camarao-salada.mp4"
POSTER="public/video/camarao-salada-poster.jpg"

mkdir -p public/video

# 720p mantém a nitidez do original; 12 fps basta porque quem controla o tempo é
# o dedo, não o relógio. Medido: 3,0 MB (contra 5,8 MB a 24 fps).
ffmpeg -y -i "$ORIGEM" \
  -an \
  -vf "scale=720:-2,fps=12" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -crf 28 -preset medium \
  -movflags +faststart \
  "$DESTINO"

# Poster = primeiro frame. É o que aparece antes de carregar e o fallback
# permanente sob reduced-motion.
ffmpeg -y -i "$DESTINO" -frames:v 1 -q:v 3 "$POSTER"

echo "pronto:"
ls -lh "$DESTINO" "$POSTER"
