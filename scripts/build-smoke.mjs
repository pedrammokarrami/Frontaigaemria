#!/usr/bin/env node
/**
 * AIGAMERIA — post-build smoke test.
 * Verifies the production bundle is deployable: dist/index.html parses, every
 * referenced JS/CSS asset exists, no missing media referenced from the shell,
 * and the bundle contains the app mount markers (no stale/empty build).
 *
 * Usage: node scripts/build-smoke.mjs  → exit 0 clean / exit 1 broken
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

function fail(msg) {
  console.error(`✘ ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('dist/index.html missing — run npm run build first');

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// 1. Root mount point exists
if (!html.includes('id="root"')) fail('index.html has no #root mount point');

// 2. Every referenced local asset exists on disk
const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
let checked = 0;
for (const ref of refs) {
  if (/^(https?:)?\/\//.test(ref)) continue; // external CDN refs — not local build deps
  const file = path.join(DIST, decodeURIComponent(new URL(ref, 'http://x').pathname));
  if (!fs.existsSync(file)) fail(`referenced asset missing on disk: ${ref}`);
  checked += 1;
}

// 3. The JS entry contains app mount markers (guards against stale/empty builds)
const jsEntry = refs.find((r) => r.endsWith('.js'));
if (!jsEntry) fail('no JS entry script referenced');
const js = fs.readFileSync(path.join(DIST, jsEntry.replace(/^\//, '')), 'utf8');
const markers = ['aipetros-spatial-root', 'AIGAMERIA'];
const missingMarkers = markers.filter((m) => !js.includes(m));
if (missingMarkers.length) fail(`bundle missing app markers: ${missingMarkers.join(', ')}`);

// 4. No sourcemap references pointing to non-existent files
for (const m of [...js.matchAll(/\/\/# sourceMappingURL=(\S+)/g)]) {
  const mapPath = path.join(DIST, path.dirname(jsEntry), m[1]);
  if (!fs.existsSync(mapPath)) console.warn(`⚠ sourcemap missing (non-fatal): ${m[1]}`);
}

console.log(`✔ build smoke OK — index.html mounts #root, ${checked} local assets verified, entry bundle has app markers`);
