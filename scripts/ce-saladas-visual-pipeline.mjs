#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const ftpDir = '/home/graco/ftp-data/cardapio-cesaladas/ce-saladas';
const publicDir = resolve(rootDir, 'public/menu-visuals/salads');

const products = [
  ['almondega-premium', 'almondega.png'],
  ['basic-lombo', 'basic-lombo.webp'],
  ['especial-file-de-frango', 'especial-frango.png'],
  ['magnifico-camarao', 'camarão.webp'],
  ['queridinha', 'queridinha.webp'],
  ['tilapia-suprema', 'tilapia.webp'],
  ['salmao-premium', 'salmao.webp'],
].map(([slug, file]) => ({
  slug,
  source: `${ftpDir}/${file}`,
  outDir: `${publicDir}/${slug}`,
}));

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const onlySlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1];
const onlyVariant = process.argv.find((arg) => arg.startsWith('--variant='))?.split('=')[1];

const selectedProducts = onlySlug
  ? products.filter((product) => product.slug === onlySlug)
  : products;

if (onlySlug && selectedProducts.length === 0) {
  throw new Error(`Slug desconhecido: ${onlySlug}`);
}

const filters = {
  source: {
    output: 'source.webp',
    args: [
      '-vf',
      'scale=1600:1600:force_original_aspect_ratio=decrease,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '88',
      '-compression_level',
      '6',
    ],
  },
  'hero-square': {
    output: 'hero-square.webp',
    args: [
      '-vf',
      'scale=2048:2048:force_original_aspect_ratio=increase,crop=2048:2048,unsharp=5:5:0.6:3:3:0.3,eq=saturation=1.02:contrast=1.02,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '90',
      '-compression_level',
      '6',
    ],
  },
  card: {
    output: 'card.webp',
    args: [
      '-vf',
      'scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024,unsharp=5:5:0.55:3:3:0.25,eq=saturation=1.03:contrast=1.02,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '88',
      '-compression_level',
      '6',
    ],
  },
  detail: {
    output: 'detail.webp',
    args: [
      '-vf',
      'scale=2048:2048:force_original_aspect_ratio=increase,crop=2048:2048,unsharp=5:5:0.65:3:3:0.35,eq=saturation=1.03:contrast=1.02,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '90',
      '-compression_level',
      '6',
    ],
  },
  'slide-wide': {
    output: 'slide-wide.webp',
    args: [
      '-filter_complex',
      '[0:v]scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,boxblur=28:2,eq=saturation=0.78:brightness=0.05[bg];[0:v]scale=1500:1180:force_original_aspect_ratio=decrease,unsharp=5:5:0.6:3:3:0.25[fg];[bg][fg]overlay=W*0.54:(H-h)/2,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '88',
      '-compression_level',
      '6',
    ],
  },
  'slide-vertical': {
    output: 'slide-vertical.webp',
    args: [
      '-filter_complex',
      '[0:v]scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560,boxblur=28:2,eq=saturation=0.78:brightness=0.05[bg];[0:v]scale=1240:1500:force_original_aspect_ratio=decrease,unsharp=5:5:0.6:3:3:0.25[fg];[bg][fg]overlay=(W-w)/2:H*0.16,format=yuv420p',
      '-c:v',
      'libwebp',
      '-quality',
      '88',
      '-compression_level',
      '6',
    ],
  },
};

const selectedFilters = onlyVariant
  ? Object.entries(filters).filter(([key]) => key === onlyVariant)
  : Object.entries(filters);

if (onlyVariant && selectedFilters.length === 0) {
  throw new Error(`Variant desconhecida: ${onlyVariant}`);
}

for (const product of selectedProducts) {
  if (!existsSync(product.source)) {
    throw new Error(`Foto real não encontrada para ${product.slug}: ${product.source}`);
  }

  mkdirSync(product.outDir, { recursive: true });

  for (const [variant, config] of selectedFilters) {
    const output = `${product.outDir}/${config.output}`;
    const command = [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      product.source,
      ...config.args,
      output,
    ];

    if (dryRun) {
      console.log(`[dry-run] ${product.slug}/${variant}: ffmpeg ${command.join(' ')}`);
      continue;
    }

    const result = spawnSync('ffmpeg', command, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      throw new Error(`${product.slug}/${variant} falhou: ${result.stderr || result.stdout}`);
    }

    console.log(`[ok] ${product.slug}/${config.output}`);
  }
}
