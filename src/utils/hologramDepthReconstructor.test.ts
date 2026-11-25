import assert from 'node:assert/strict';
import test from 'node:test';
import { reconstructVolumetricDepthField } from './hologramDepthReconstructor.ts';

test('reconstructVolumetricDepthField sculpts true 3D facial nose prominence, outward normals, and welded rear volume', () => {
  const w = 64;
  const h = 84;
  const rgba = new Uint8Array(w * h * 4);

  // Draw a synthetic head + neck + shoulders bust silhouette centered on pure black background
  for (let y = 0; y < h; y += 1) {
    const ny = y / (h - 1);
    for (let x = 0; x < w; x += 1) {
      const nx = x / (w - 1);
      const headDx = (nx - 0.5) / 0.17;
      const headDy = (ny - 0.27) / 0.16;
      const inHead = headDx * headDx + headDy * headDy <= 1.0;
      const inNeck = Math.abs(nx - 0.5) <= 0.08 && ny >= 0.39 && ny <= 0.50;
      const torsoDx = (nx - 0.5) / 0.32;
      const torsoDy = (ny - 0.72) / 0.25;
      const inTorso = torsoDx * torsoDx + torsoDy * torsoDy <= 1.0 && ny >= 0.46;

      const p = (y * w + x) * 4;
      if (inHead || inNeck || inTorso) {
        rgba[p + 0] = 90;
        rgba[p + 1] = 195;
        rgba[p + 2] = 255;
        rgba[p + 3] = 255;
      } else {
        rgba[p + 3] = 255;
      }
    }
  }

  const field = reconstructVolumetricDepthField(rgba, w, h);
  assert.equal(field.depth.length, w * h);
  assert.equal(field.backDepth.length, w * h);
  assert.equal(field.normalDepthRgba.length, w * h * 4);
  assert.equal(field.backNormalDepthRgba.length, w * h * 4);

  const bgDepth = field.depth[2 * w + 2];
  const bgBackDepth = field.backDepth[2 * w + 2];
  assert.equal(bgDepth, 0);
  assert.equal(bgBackDepth, 0);

  const noseY = Math.round(field.bounds.noseTipY * (h - 1));
  const cx = Math.round(field.bounds.headCenterX * (w - 1));
  const noseDepth = field.depth[noseY * w + cx];
  const cheekEdgeDepth = field.depth[noseY * w + Math.round((field.bounds.headCenterX - 0.14) * (w - 1))];
  const rearHeadDepth = field.backDepth[noseY * w + cx];

  // Nose tip projects significantly further forward than cheek edge, and rear cranium has solid depth
  assert.ok(
    noseDepth > cheekEdgeDepth + 0.22,
    `Expected protruding 3D nose (${noseDepth}) > cheek edge (${cheekEdgeDepth})`
  );
  assert.ok(rearHeadDepth > 0.35, `Expected solid 3D rear cranium depth (${rearHeadDepth}) > 0.35`);

  // Left-side torso normal should point toward -X (R < 122), right-side toward +X (R > 134)
  const torsoY = Math.floor(h * 0.68);
  const leftIdx = (torsoY * w + Math.floor(w * 0.26)) * 4;
  const rightIdx = (torsoY * w + Math.floor(w * 0.74)) * 4;
  assert.ok(field.normalDepthRgba[leftIdx] < 122, 'Left flank normal should point toward -X');
  assert.ok(field.normalDepthRgba[rightIdx] > 134, 'Right flank normal should point toward +X');
});
