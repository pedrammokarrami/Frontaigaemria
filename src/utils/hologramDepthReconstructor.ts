export interface ReconstructedDepthField {
  width: number;
  height: number;
  /** Normalized 0..1 sculpted 3D front depth (cranium + nose + cheekbones + chin + chest) */
  depth: Float32Array;
  /** Normalized 0..1 smooth solid rear cranium & torso depth for closed 3D back-shell */
  backDepth: Float32Array;
  /** Normalized 0..1 foreground silhouette alpha mask */
  mask: Float32Array;
  /** Packed RGBA bytes: R=Nx, G=Ny, B=Nz, A=FrontDepth (0..255) for THREE.DataTexture */
  normalDepthRgba: Uint8Array;
  /** Packed RGBA bytes: R=BackNx, G=BackNy, B=BackNz, A=BackDepth (0..255) for closed 3D rear shell */
  backNormalDepthRgba: Uint8Array;
  /** Detected anatomical silhouette landmarks (normalized 0..1) */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    headCenterX: number;
    headCenterY: number;
    neckY: number;
    noseTipY: number;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function gaussian2D(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / Math.max(1e-4, rx);
  const dy = (y - cy) / Math.max(1e-4, ry);
  return Math.exp(-(dx * dx + dy * dy));
}

/**
 * Separable box blur pass used to keep macro 3D volumetric depth completely organic & silky.
 */
function boxBlur2D(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      let cnt = 0;
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      for (let k = x0; k <= x1; k += 1) {
        sum += src[row + k];
        cnt += 1;
      }
      tmp[row + x] = sum / cnt;
    }
  }

  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      let cnt = 0;
      for (let k = y0; k <= y1; k += 1) {
        sum += tmp[k * w + x];
        cnt += 1;
      }
      dst[y * w + x] = sum / cnt;
    }
  }

  return dst;
}

function packNormalsAndDepth(
  depthField: Float32Array,
  width: number,
  height: number,
  normalStrength: number,
  flipZ: boolean
): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  const zSign = flipZ ? -1.0 : 1.0;

  for (let y = 0; y < height; y += 1) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(height - 1, y + 1);
    for (let x = 0; x < width; x += 1) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(width - 1, x + 1);
      const i = y * width + x;

      const dL = depthField[y * width + xm];
      const dR = depthField[y * width + xp];
      const dU = depthField[ym * width + x];
      const dD = depthField[yp * width + x];

      const gx = (dR - dL) * normalStrength;
      const gy = (dD - dU) * normalStrength;

      let nx = -gx;
      let ny = gy;
      let nz = zSign;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const p = i * 4;
      rgba[p + 0] = Math.round(clamp(nx * 0.5 + 0.5, 0, 1) * 255);
      rgba[p + 1] = Math.round(clamp(ny * 0.5 + 0.5, 0, 1) * 255);
      rgba[p + 2] = Math.round(clamp(nz * 0.5 + 0.5, 0, 1) * 255);
      rgba[p + 3] = Math.round(clamp(depthField[i], 0, 1) * 255);
    }
  }

  return rgba;
}

/**
 * Reconstructs a full closed 3D anatomical volumetric human bust (Front Face/Nose/Cheeks/Chin/Chest
 * + seamlessly welded Rear Cranium/Neck/Shoulders) and 3D Surface Normals from any portrait plate.
 *
 * Ensures genuine 3D side-profile geometry when orbited 45°–75° sideways:
 *  - True 3D spherical cranium & deep rounded ribcage/shoulders (not a thin flat card)
 *  - Protruding 3D nose bridge & tip, brow ridge, recessed eye sockets, cheekbones, lips & chin
 *  - Recessed cylindrical neck underneath the jawline
 *  - Seamlessly welded rear head & shoulder volume meeting the front shell cleanly at z = 0
 */
export function reconstructVolumetricDepthField(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): ReconstructedDepthField {
  const total = width * height;
  const mask = new Float32Array(total);
  const luma = new Float32Array(total);
  const dist = new Float32Array(total);

  const rowMinX = new Float32Array(height).fill(width);
  const rowMaxX = new Float32Array(height).fill(0);
  const rowCount = new Uint16Array(height);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let fgCount = 0;
  let sumX = 0;

  // 1. Extract foreground silhouette, luminance, and per-row horizontal spans
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const p = i * 4;
      const r = rgba[p] / 255;
      const g = rgba[p + 1] / 255;
      const b = rgba[p + 2] / 255;
      const maxCh = Math.max(r, g, b);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const fg = smoothstep(0.045, 0.22, maxCh);

      mask[i] = fg;
      luma[i] = lum;

      if (fg > 0.24) {
        dist[i] = 1e6;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < rowMinX[y]) rowMinX[y] = x;
        if (x > rowMaxX[y]) rowMaxX[y] = x;
        rowCount[y] += 1;
        sumX += x;
        fgCount += 1;
      } else {
        dist[i] = 0;
      }
    }
  }

  if (fgCount === 0) {
    minX = Math.floor(width * 0.2);
    maxX = Math.floor(width * 0.8);
    minY = Math.floor(height * 0.1);
    maxY = Math.floor(height * 0.9);
  }

  const normMinX = minX / width;
  const normMaxX = maxX / width;
  const normMinY = minY / height;
  const normMaxY = maxY / height;
  const centerX = fgCount > 0 ? sumX / fgCount / width : 0.5;
  const fgHeight = Math.max(0.28, normMaxY - normMinY);

  // 2. Auto-detect Head Center, Head Width, and Neck Pinch from silhouette row profile
  const headScanStart = Math.floor(clamp(normMinY + fgHeight * 0.10, 0, 1) * (height - 1));
  const headScanEnd = Math.floor(clamp(normMinY + fgHeight * 0.36, 0, 1) * (height - 1));
  let headCxSum = 0;
  let headCxCnt = 0;
  const headWidths: number[] = [];

  for (let y = headScanStart; y <= headScanEnd; y += 1) {
    if (rowCount[y] > 4) {
      const span = (rowMaxX[y] - rowMinX[y]) / width;
      const rcx = (rowMinX[y] + rowMaxX[y]) * 0.5 / width;
      headCxSum += rcx;
      headCxCnt += 1;
      headWidths.push(span);
    }
  }

  const headCenterX = headCxCnt > 0 ? clamp(headCxSum / headCxCnt, 0.36, 0.64) : centerX;
  headWidths.sort((a, b) => a - b);
  const rawHeadW =
    headWidths.length > 0 ? headWidths[Math.floor(headWidths.length * 0.65)] : 0.30;
  const headHalfW = clamp(rawHeadW * 0.46, 0.11, 0.19);

  // Detect neck pinch (narrowest silhouette row between head & shoulders)
  const neckScanStart = Math.floor(clamp(normMinY + fgHeight * 0.33, 0, 1) * (height - 1));
  const neckScanEnd = Math.floor(clamp(normMinY + fgHeight * 0.50, 0, 1) * (height - 1));
  let bestNeckY = normMinY + fgHeight * 0.42;
  let minNeckSpan = Infinity;
  for (let y = neckScanStart; y <= neckScanEnd; y += 1) {
    if (rowCount[y] > 4) {
      const span = (rowMaxX[y] - rowMinX[y]) / width;
      if (span < minNeckSpan) {
        minNeckSpan = span;
        bestNeckY = y / height;
      }
    }
  }
  const neckY = clamp(bestNeckY, normMinY + fgHeight * 0.35, normMinY + fgHeight * 0.49);

  // Facial anatomical vertical anchors calibrated between crown & neck
  const faceTopY = normMinY + fgHeight * 0.05;
  const chinY = neckY - fgHeight * 0.015;
  const faceH = Math.max(0.16, chinY - faceTopY);
  const headCenterY = faceTopY + faceH * 0.46;
  const browY = faceTopY + faceH * 0.36;
  const eyeY = faceTopY + faceH * 0.45;
  const noseTipY = faceTopY + faceH * 0.61;
  const cheekY = faceTopY + faceH * 0.57;
  const mouthY = faceTopY + faceH * 0.74;
  const chinTipY = faceTopY + faceH * 0.89;

  // 3. Two-Pass Chamfer Euclidean Distance Transform (SDF inward from silhouette)
  const DIAG = 1.41421356;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      let d = dist[i];
      if (d === 0) continue;
      if (x > 0) d = Math.min(d, dist[i - 1] + 1);
      if (y > 0) d = Math.min(d, dist[i - width] + 1);
      if (x > 0 && y > 0) d = Math.min(d, dist[i - width - 1] + DIAG);
      if (x < width - 1 && y > 0) d = Math.min(d, dist[i - width + 1] + DIAG);
      dist[i] = d;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const i = y * width + x;
      let d = dist[i];
      if (d === 0) continue;
      if (x < width - 1) d = Math.min(d, dist[i + 1] + 1);
      if (y < height - 1) d = Math.min(d, dist[i + width] + 1);
      if (x < width - 1 && y < height - 1) d = Math.min(d, dist[i + width + 1] + DIAG);
      if (x > 0 && y < height - 1) d = Math.min(d, dist[i + width - 1] + DIAG);
      dist[i] = d;
    }
  }

  let maxDist = 1;
  for (let i = 0; i < total; i += 1) {
    if (dist[i] < 1e5 && dist[i] > maxDist) maxDist = dist[i];
  }

  // 4. Sculpt True 3D Front Bust (Spherical Cranium + 3D Facial Profile + Neck + Ribcage)
  //    AND Clean Solid 3D Rear Cranium/Torso Enclosure (zero facial features on rear!)
  const rawFront = new Float32Array(total);
  const rawBack = new Float32Array(total);
  const sdfScale = Math.max(8, Math.min(maxDist, width * 0.24));

  for (let y = 0; y < height; y += 1) {
    const ny = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const nx = x / (width - 1);
      const i = y * width + x;
      const fg = mask[i];
      if (fg < 0.01) {
        rawFront[i] = 0;
        rawBack[i] = 0;
        continue;
      }

      // Smooth spherical SDF inflation from silhouette edge (0 at edge -> 1 inside)
      const dNorm = clamp(dist[i] / sdfScale, 0, 1);
      const sdfDome = Math.sqrt(Math.max(0, 1 - Math.pow(1 - dNorm, 2)));

      // True 3D spherical cranium ellipsoid (gives full round side-profile head volume!)
      const dxH = (nx - headCenterX) / (headHalfW * 1.12);
      const dyH = (ny - headCenterY) / (faceH * 0.56);
      const r2H = dxH * dxH + dyH * dyH;
      const craniumSphere = r2H < 1.0 ? Math.sqrt(1.0 - r2H) : 0.0;

      // Full 3D rounded torso/chest ellipsoid & shoulder caps below neck
      const torsoCenterY = neckY + fgHeight * 0.30;
      const dxT = (nx - centerX) / 0.34;
      const dyT = (ny - torsoCenterY) / (fgHeight * 0.34);
      const r2T = dxT * dxT + dyT * dyT;
      const torsoSphere = r2T < 1.0 ? Math.sqrt(1.0 - r2T) : 0.0;

      const shoulderY = neckY + fgHeight * 0.14;
      const leftShoulder = gaussian2D(nx, ny, centerX - 0.20, shoulderY, 0.13, fgHeight * 0.14);
      const rightShoulder = gaussian2D(nx, ny, centerX + 0.20, shoulderY, 0.13, fgHeight * 0.14);
      const shouldersVolume = Math.max(leftShoulder, rightShoulder) * 0.44;

      // Recessed cylindrical neck transition beneath jaw
      const neckRecess =
        gaussian2D(nx, ny, headCenterX, neckY + fgHeight * 0.03, headHalfW * 0.72, fgHeight * 0.06) *
        0.10;

      // Anatomically natural 3D Sculpted Facial Profile (true human proportions in 3/4 & side view!)
      const browRidge =
        gaussian2D(nx, ny, headCenterX, browY, headHalfW * 0.62, faceH * 0.085) * 0.06;
      const leftSocket = gaussian2D(
        nx,
        ny,
        headCenterX - headHalfW * 0.31,
        eyeY,
        headHalfW * 0.19,
        faceH * 0.075
      );
      const rightSocket = gaussian2D(
        nx,
        ny,
        headCenterX + headHalfW * 0.31,
        eyeY,
        headHalfW * 0.19,
        faceH * 0.075
      );
      const eyeRecess = (leftSocket + rightSocket) * 0.055;

      // Realistic 3D Nose Bridge & Protruding Nose Tip (crisp profile without exaggeration)
      const noseBridge =
        gaussian2D(
          nx,
          ny,
          headCenterX,
          (eyeY + noseTipY) * 0.5,
          headHalfW * 0.12,
          faceH * 0.13
        ) * 0.10;
      const noseTip =
        gaussian2D(nx, ny, headCenterX, noseTipY, headHalfW * 0.13, faceH * 0.075) * 0.15;

      // Sculpted Cheekbones, Lips, and Chin
      const leftCheek = gaussian2D(
        nx,
        ny,
        headCenterX - headHalfW * 0.38,
        cheekY,
        headHalfW * 0.24,
        faceH * 0.12
      );
      const rightCheek = gaussian2D(
        nx,
        ny,
        headCenterX + headHalfW * 0.38,
        cheekY,
        headHalfW * 0.24,
        faceH * 0.12
      );
      const cheeks = (leftCheek + rightCheek) * 0.06;
      const lips = gaussian2D(nx, ny, headCenterX, mouthY, headHalfW * 0.22, faceH * 0.075) * 0.055;
      const chin =
        gaussian2D(nx, ny, headCenterX, chinTipY, headHalfW * 0.21, faceH * 0.085) * 0.065;

      // Weight facial sculpture strictly within the core silhouette so edges always weld smoothly to 0
      const interiorWeight = smoothstep(0.10, 0.42, sdfDome);
      const macroBody = Math.max(
        sdfDome * 0.52 + craniumSphere * 0.30,
        sdfDome * 0.46 + torsoSphere * 0.30 + shouldersVolume * 0.20
      );

      const frontSculpt =
        macroBody -
        neckRecess * interiorWeight +
        (browRidge - eyeRecess + noseBridge + noseTip + cheeks + lips + chin) * interiorWeight;

      rawFront[i] = fg * clamp(frontSculpt, 0, 1);

      // Rear 3D Cranium + Back of Shoulders (smooth rounded solid volume — ZERO facial features!)
      const rearCranium = craniumSphere * 0.44;
      const rearTorso = torsoSphere * 0.38 + shouldersVolume * 0.24;
      rawBack[i] = fg * clamp(sdfDome * 0.52 + Math.max(rearCranium, rearTorso) * 0.46, 0, 1);
    }
  }

  // Smooth front & back volumes so vertices form a silky, continuous 3D sculpture
  const smoothFront = boxBlur2D(boxBlur2D(rawFront, width, height, 3), width, height, 2);
  const smoothBack = boxBlur2D(boxBlur2D(rawBack, width, height, 4), width, height, 3);
  const smoothLuma = boxBlur2D(luma, width, height, 3);

  const finalDepth = new Float32Array(total);
  const finalBackDepth = new Float32Array(total);

  for (let i = 0; i < total; i += 1) {
    const fg = mask[i];
    // Strict shared silhouette boundary so front & back meshes weld watertightly at z = 0 with ZERO gap
    if (fg < 0.14) {
      finalDepth[i] = 0;
      finalBackDepth[i] = 0;
      continue;
    }
    const edgeRamp = smoothstep(0.14, 0.45, fg);
    const microRelief = clamp((luma[i] - smoothLuma[i]) * 0.10, -0.025, 0.025);
    finalDepth[i] = clamp(
      edgeRamp * (smoothFront[i] * 0.96 + luma[i] * 0.04 + microRelief),
      0,
      1
    );
    finalBackDepth[i] = clamp(edgeRamp * smoothBack[i], 0, 1);
  }

  const normalDepthRgba = packNormalsAndDepth(finalDepth, width, height, 2.6, false);
  const backNormalDepthRgba = packNormalsAndDepth(finalBackDepth, width, height, 2.4, true);

  return {
    width,
    height,
    depth: finalDepth,
    backDepth: finalBackDepth,
    mask,
    normalDepthRgba,
    backNormalDepthRgba,
    bounds: {
      minX: normMinX,
      maxX: normMaxX,
      minY: normMinY,
      maxY: normMaxY,
      centerX,
      headCenterX,
      headCenterY,
      neckY,
      noseTipY,
    },
  };
}
