import * as THREE from 'three';
import type { Hologram3DGameId } from '../../data/gameTournamentThemes';

export interface HologramTerrainConfig {
  gameId: Hologram3DGameId;
  mapMode: number; // 0=FC27, 1=WARZONE, 2=CS2, 3=GTA, 4=RDR2, 5=APEX
  primaryHex: string;
  secondaryHex: string;
  baseGlassHex: string;
  contourDensity: number;
  sweepSpeed: number;
  radius: number;
  segments: number;
}

export const HOLOGRAM_TERRAIN_CONFIGS: Record<Hologram3DGameId, HologramTerrainConfig> = {
  FC27: {
    gameId: 'FC27',
    mapMode: 0,
    primaryHex: '#00E676',
    secondaryHex: '#A7F3D0',
    baseGlassHex: '#041a11',
    contourDensity: 24.0,
    sweepSpeed: 0.72,
    radius: 1.52,
    segments: 256,
  },
  WARZONE: {
    gameId: 'WARZONE',
    mapMode: 1,
    primaryHex: '#F59E0B',
    secondaryHex: '#EA580C',
    baseGlassHex: '#18130a',
    contourDensity: 28.0,
    sweepSpeed: 1.05,
    radius: 1.52,
    segments: 256,
  },
  CS2: {
    gameId: 'CS2',
    mapMode: 2,
    primaryHex: '#DE6B24',
    secondaryHex: '#38BDF8',
    baseGlassHex: '#0a1222',
    contourDensity: 26.0,
    sweepSpeed: 0.85,
    radius: 1.52,
    segments: 256,
  },
  GTA: {
    gameId: 'GTA',
    mapMode: 3,
    primaryHex: '#EC4899',
    secondaryHex: '#06B6D4',
    baseGlassHex: '#120720',
    contourDensity: 26.0,
    sweepSpeed: 0.92,
    radius: 1.52,
    segments: 256,
  },
  RDR2: {
    gameId: 'RDR2',
    mapMode: 4,
    primaryHex: '#B91C1C',
    secondaryHex: '#D97706',
    baseGlassHex: '#1c0f0a',
    contourDensity: 24.0,
    sweepSpeed: 0.58,
    radius: 1.52,
    segments: 256,
  },
  APEX: {
    gameId: 'APEX',
    mapMode: 5,
    primaryHex: '#DA292A',
    secondaryHex: '#F3F4F6',
    baseGlassHex: '#13161e',
    contourDensity: 30.0,
    sweepSpeed: 1.12,
    radius: 1.52,
    segments: 256,
  },
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstepJS(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Smooth rounded plateau helper for architectural / urban / mesa elevation terraces
 * without creating blocky low-poly primitives.
 */
function smoothPlateau(
  x: number,
  z: number,
  cx: number,
  cz: number,
  hx: number,
  hz: number,
  height: number,
  bevel = 0.08
): number {
  const dx = Math.abs(x - cx) - hx;
  const dz = Math.abs(z - cz) - hz;
  const d = Math.max(dx, dz);
  return (1 - smoothstepJS(-bevel, bevel, d)) * height;
}

/**
 * Evaluates smooth elevation height `y` for each of the 6 game-native 256x256 hologram terrains.
 * Shared between vertex generation and objective pin / trajectory grounding.
 */
export function evaluateTerrainHeight(gameId: Hologram3DGameId, x: number, z: number): number {
  const maxR = HOLOGRAM_TERRAIN_CONFIGS[gameId].radius;
  const dist = Math.hypot(x, z);
  const rimFalloff = 1 - smoothstepJS(maxR * 0.78, maxR, dist);

  switch (gameId) {
    case 'FC27': {
      // Precision flat central football pitch surrounded by a gently rising holographic stadium bowl terrace
      const pitchDx = Math.max(0, Math.abs(x) - 1.18);
      const pitchDz = Math.max(0, Math.abs(z) - 0.78);
      const outsidePitch = Math.hypot(pitchDx, pitchDz);
      const bowl = smoothstepJS(0.04, 0.42, outsidePitch) * 0.34;
      const tiers = bowl + Math.sin(outsidePitch * 24.0) * 0.012 * smoothstepJS(0.06, 0.2, outsidePitch);
      return 0.06 + tiers * rimFalloff;
    }

    case 'WARZONE': {
      // Urzikstan / Rebirth Island topographic ridges + central Superstore basin plateau + coastal slope
      const ridge1 = Math.sin(x * 2.25 + 0.4) * Math.cos(z * 1.95 - 0.3) * 0.24;
      const ridge2 = Math.sin((x * 1.6 - z * 1.4) * 2.1) * 0.12;
      const ridge3 = Math.cos(Math.hypot(x - 0.55, z + 0.48) * 3.8) * 0.08;
      const northPeak = Math.exp(-((x + 0.65) ** 2 + (z + 0.52) ** 2) * 2.8) * 0.42;
      const eastPeak = Math.exp(-((x - 0.72) ** 2 + (z - 0.38) ** 2) * 3.2) * 0.34;
      const superstorePad = smoothPlateau(x, z, -0.06, 0.04, 0.28, 0.2, 0.14, 0.09);
      const raw = Math.max(0.02, 0.16 + ridge1 + ridge2 + ridge3 + northPeak + eastPeak + superstorePad);
      return 0.05 + raw * rimFalloff;
    }

    case 'CS2': {
      // Mirage A-Site smooth architectural elevation relief (Palace balcony, A-Ramp, Triple, Default, Stairs, Ticket)
      let h = 0.05;
      // Palace upper balcony (west-south)
      h = Math.max(h, 0.05 + smoothPlateau(x, z, -0.88, 0.48, 0.32, 0.26, 0.34, 0.07));
      // A-Ramp slope
      h = Math.max(h, 0.05 + smoothPlateau(x, z, -0.82, -0.34, 0.3, 0.18, 0.18, 0.09));
      // Stairs + Jungle terrace
      h = Math.max(h, 0.05 + smoothPlateau(x, z, 0.42, 0.56, 0.26, 0.2, 0.24, 0.08));
      h = Math.max(h, 0.05 + smoothPlateau(x, z, 0.84, 0.34, 0.22, 0.26, 0.28, 0.07));
      // CT Ticket Booth elevated cover
      h = Math.max(h, 0.05 + smoothPlateau(x, z, 0.84, -0.52, 0.24, 0.22, 0.31, 0.07));
      // Triple + Firebox subtle stepped relief around Site A
      h = Math.max(h, 0.05 + smoothPlateau(x, z, 0.16, -0.04, 0.15, 0.15, 0.17, 0.06));
      h = Math.max(h, 0.05 + smoothPlateau(x, z, -0.26, -0.32, 0.14, 0.13, 0.13, 0.06));
      const micro = Math.sin(x * 5.0) * Math.cos(z * 5.0) * 0.008;
      return 0.04 + (h + micro) * rimFalloff;
    }

    case 'GTA': {
      // Vice City / Los Santos neon coastal contour bay + Vinewood Hills ridge + sculpted Diamond Casino terrace
      const vinewoodRidge =
        Math.exp(-((z + 0.85) ** 2) * 3.4) *
        (0.38 + 0.14 * Math.sin(x * 3.2 + 0.5)) *
        smoothstepJS(-1.5, -0.2, x + 0.8);
      // Diamond Casino central concentric stepped terrace
      const casinoDist = Math.hypot(x - 0.02, z + 0.04);
      const casinoPad = (1 - smoothstepJS(0.24, 0.46, casinoDist)) * 0.28 +
        (1 - smoothstepJS(0.11, 0.22, casinoDist)) * 0.14;
      // Downtown contoured urban pads (smooth organic terraced hills, zero boxes)
      const westDistrict = Math.exp(-((x + 0.82) ** 2 + (z - 0.28) ** 2) * 3.6) * 0.26;
      const eastMarina = Math.exp(-((x - 0.86) ** 2 + (z - 0.34) ** 2) * 3.2) * 0.24;
      // Coastal bay depression on south-east
      const bayDip = Math.exp(-((x - 0.48) ** 2 + (z - 0.72) ** 2) * 3.2) * 0.06;
      const raw = Math.max(0.02, 0.08 + vinewoodRidge + casinoPad + westDistrict + eastMarina - bayDip);
      return 0.05 + raw * rimFalloff;
    }

    case 'RDR2': {
      // Valentine Red-Rock Canyon & stepped mesa plateaus split by a winding frontier river gorge
      const riverCenterX = Math.sin(z * 1.85) * 0.34;
      const distFromRiver = Math.abs(x - riverCenterX);
      const canyonWall = smoothstepJS(0.24, 0.92, distFromRiver);
      // Smooth stratigraphic rock terraces (continuous smoothstep bands, not blocky)
      const band1 = smoothstepJS(0.15, 0.32, canyonWall) * 0.18;
      const band2 = smoothstepJS(0.45, 0.62, canyonWall) * 0.22;
      const band3 = smoothstepJS(0.75, 0.92, canyonWall) * 0.18;
      const ridgeDetail = Math.sin(x * 3.4 + z * 2.2) * 0.035 * canyonWall;
      const valentinePlateau = smoothPlateau(x, z, 0.02, -0.02, 0.22, 0.18, 0.09, 0.08);
      const raw = 0.04 + band1 + band2 + band3 + ridgeDetail + valentinePlateau;
      return 0.04 + raw * rimFalloff;
    }

    case 'APEX': {
      // World's Edge Volcanic Caldera: crisp sculpted outer crater rim + central Harvester ridge + diagonal lava fissure trench
      const rNorm = dist / maxR;
      const craterRim =
        smoothstepJS(0.32, 0.74, rNorm) *
        (0.28 + 0.1 * Math.sin(Math.atan2(z, x) * 5.0 + 0.7) + 0.06 * Math.cos(x * 4.2 - z * 3.6));
      const centralHarvester = Math.exp(-((x - 0.06) ** 2 + (z + 0.06) ** 2) * 8.5) * 0.24;
      // Diagonal volcanic lava fissure trench running through the caldera
      const fissureDist = Math.abs(z - (0.44 * x + 0.08 * Math.sin(x * 3.4)));
      const fissureTrench = (1 - smoothstepJS(0.05, 0.24, fissureDist)) * 0.16;
      const raw = Math.max(0.01, 0.1 + craterRim + centralHarvester - fissureTrench);
      return 0.04 + raw * rimFalloff;
    }
  }
}

/**
 * Builds a high-resolution 256x256 smooth circular terrain BufferGeometry with precomputed
 * analytical elevation and smooth vertex normals (ZERO wireframe, ZERO low-poly blocks).
 */
export function createSmoothTopographicGeometry(config: HologramTerrainConfig): THREE.PlaneGeometry {
  const diameter = config.radius * 2;
  const geo = new THREE.PlaneGeometry(diameter, diameter, config.segments, config.segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const maxR = config.radius;
  const elevations = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let z = pos.getZ(i);
    // Smoothly map square grid into a clean circular hologram disc (elliptical disc mapping avoids corner bunching)
    const nx = x / maxR;
    const nz = z / maxR;
    const cx = nx * Math.sqrt(Math.max(0, 1 - 0.5 * nz * nz)) * maxR;
    const cz = nz * Math.sqrt(Math.max(0, 1 - 0.5 * nx * nx)) * maxR;
    x = cx;
    z = cz;

    const y = evaluateTerrainHeight(config.gameId, x, z);
    pos.setXYZ(i, x, y, z);
    elevations[i] = y;
  }

  geo.setAttribute('aElevation', new THREE.BufferAttribute(elevations, 1));
  geo.computeVertexNormals();
  return geo;
}

const HOLOGRAM_TERRAIN_VERTEX_SHADER = /* glsl */ `
  attribute float aElevation;
  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vElevation = aElevation;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HOLOGRAM_TERRAIN_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  uniform float uContourDensity;
  uniform float uSweepSpeed;
  uniform int uMapMode;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uBaseGlassColor;

  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  // Anti-aliased line around value == 0.0
  float aaLine(float dist, float widthPx) {
    float fw = max(fwidth(dist), 0.0005);
    return 1.0 - smoothstep(0.0, fw * widthPx, abs(dist));
  }

  // Anti-aliased SDF rectangle outline
  float rectOutline(vec2 p, vec2 halfSize, float widthPx) {
    vec2 q = abs(p) - halfSize;
    float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    return aaLine(sdf, widthPx);
  }

  // Anti-aliased SDF circle outline
  float circleOutline(vec2 p, float r, float widthPx) {
    return aaLine(length(p) - r, widthPx);
  }

  void main() {
    float radialDist = length(vLocalPos.xz);
    float rNorm = radialDist / uRadius;
    if (rNorm > 1.0) discard;

    // 1. Smooth anti-aliased topographic elevation contour isolines using fract() + fwidth()
    float elevCoord = vElevation * uContourDensity;
    float minorDist = abs(fract(elevCoord - 0.5) - 0.5) / max(fwidth(elevCoord), 0.0006);
    float minorContour = 1.0 - smoothstep(0.0, 1.25, minorDist);

    float majorCoord = vElevation * (uContourDensity * 0.25);
    float majorDist = abs(fract(majorCoord - 0.5) - 0.5) / max(fwidth(majorCoord), 0.0006);
    float majorContour = 1.0 - smoothstep(0.0, 1.65, majorDist);

    // 2. Subtle tactical coordinate micro-grid
    vec2 gridCoord = vLocalPos.xz * 3.8;
    vec2 gridDist = abs(fract(gridCoord - 0.5) - 0.5) / max(fwidth(gridCoord), 0.0008);
    float gridLine = 1.0 - min(min(gridDist.x, gridDist.y), 1.0);
    gridLine = smoothstep(0.15, 0.85, gridLine) * 0.16;

    // 3. Animated 360-degree radar sweep beam
    float angle = atan(vLocalPos.z, vLocalPos.x);
    float sweepAngle = mod(-uTime * uSweepSpeed, 6.2831853) - 3.14159265;
    float deltaAngle = mod(angle - sweepAngle + 9.42477796, 6.2831853);
    float centerMask = smoothstep(0.05, 0.22, radialDist);
    float sweepTrail = exp(-deltaAngle * 2.9) * centerMask;
    float sweepBeam = smoothstep(0.055, 0.0, deltaAngle) * centerMask;

    // 4. Fresnel translucent glass rim glow + subtle top-down light shading
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.35);

    vec3 L = normalize(vec3(0.45, 0.85, 0.35));
    float slopeLight = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);

    // Base smoked-glass translucent surface tinted by elevation
    float elevNorm = clamp((vElevation - 0.05) / 0.55, 0.0, 1.0);
    vec3 color = mix(uBaseGlassColor * 0.72, mix(uBaseGlassColor, uPrimaryColor, 0.22), elevNorm * 0.75 + slopeLight * 0.25);

    // Add anti-aliased topographic contour isolines (brightened where the 360 radar sweep passes)
    float contourBoost = 1.0 + sweepTrail * 0.85 + sweepBeam * 1.1;
    vec3 contourColor = mix(uPrimaryColor, uSecondaryColor, majorContour * 0.45 + elevNorm * 0.25);

    // 5. Game-specific procedural GLSL tactical surface graphics
    float tacticalMark = 0.0;
    vec3 tacticalColor = uPrimaryColor;

    if (uMapMode == 0) {
      // FC 27: Precision stadium pitch markings + mown turf stripes inside the central bowl
      vec2 p = vLocalPos.xz;
      float insidePitch = step(abs(p.x), 1.16) * step(abs(p.y), 0.76);

      // Subtle mown stadium turf stripes
      float stripes = smoothstep(-0.1, 0.1, sin(p.x * 18.5));
      vec3 turfTone = mix(vec3(0.025, 0.145, 0.085), vec3(0.04, 0.215, 0.12), stripes);
      color = mix(color, turfTone, insidePitch * 0.88);

      // Crisp infinite-resolution GLSL pitch lines
      float outerLine = rectOutline(p, vec2(1.12, 0.72), 1.85);
      float halfLine = aaLine(p.x, 1.55) * step(abs(p.y), 0.72);
      float centerCircle = circleOutline(p, 0.22, 1.55);
      float leftBox = rectOutline(p - vec2(-0.92, 0.0), vec2(0.2, 0.36), 1.55);
      float rightBox = rectOutline(p - vec2(0.92, 0.0), vec2(0.2, 0.36), 1.55);
      float leftSix = rectOutline(p - vec2(-1.04, 0.0), vec2(0.08, 0.18), 1.35);
      float rightSix = rectOutline(p - vec2(1.04, 0.0), vec2(0.08, 0.18), 1.35);

      float pitchLines = clamp(outerLine + halfLine + centerCircle + leftBox + rightBox + leftSix + rightSix, 0.0, 1.0);
      tacticalMark = pitchLines * 0.92;
      tacticalColor = mix(uPrimaryColor, uSecondaryColor, 0.3);

      // Show smooth topographic stadium bowl contours around the outside of the pitch
      float bowlMask = 1.0 - insidePitch * 0.88;
      color += contourColor * (minorContour * 0.42 + majorContour * 0.72) * contourBoost * bowlMask;
    } else if (uMapMode == 1) {
      // WARZONE: Urzikstan topographic isolines + glowing Superstore tactical zone & range rings
      color += contourColor * (minorContour * 0.52 + majorContour * 0.82) * contourBoost;
      float rangeRing1 = circleOutline(vLocalPos.xz - vec2(-0.06, 0.04), 0.58, 1.45);
      float rangeRing2 = circleOutline(vLocalPos.xz - vec2(-0.06, 0.04), 1.08, 1.55);
      tacticalMark = (rangeRing1 * 0.55 + rangeRing2 * 0.7);
      tacticalColor = uPrimaryColor;
    } else if (uMapMode == 2) {
      // CS2: Mirage A-Site architectural contours + glowing Premier Orange Site-A bomb plant zone
      color += mix(uSecondaryColor, uPrimaryColor, majorContour * 0.55 + elevNorm * 0.4) *
        (minorContour * 0.48 + majorContour * 0.85) * contourBoost;

      vec2 siteP = vLocalPos.xz - vec2(-0.04, -0.1);
      float siteZone = rectOutline(siteP, vec2(0.38, 0.3), 1.9);
      float insideSite = step(abs(siteP.x), 0.38) * step(abs(siteP.y), 0.3);
      float hatch = smoothstep(0.35, 0.65, sin((siteP.x + siteP.y) * 44.0));
      color += uPrimaryColor * insideSite * (0.14 + hatch * 0.1);
      tacticalMark = siteZone * 0.95;
      tacticalColor = uPrimaryColor;
    } else if (uMapMode == 3) {
      // GTA: Vice City neon topographic contours + glowing arterial highway grid & Casino ring
      color += mix(uPrimaryColor, uSecondaryColor, smoothstep(0.0, 0.5, elevNorm)) *
        (minorContour * 0.48 + majorContour * 0.82) * contourBoost;

      vec2 roadGrid = abs(fract(vLocalPos.xz * 2.4 - 0.5) - 0.5) / max(fwidth(vLocalPos.xz * 2.4), 0.001);
      float roads = (1.0 - min(min(roadGrid.x, roadGrid.y), 1.0)) * 0.38 * smoothstep(0.26, 0.08, elevNorm);
      float casinoRing = circleOutline(vLocalPos.xz - vec2(0.02, -0.04), 0.42, 1.8);
      tacticalMark = clamp(roads + casinoRing * 0.88, 0.0, 1.0);
      tacticalColor = mix(uSecondaryColor, uPrimaryColor, casinoRing);
    } else if (uMapMode == 4) {
      // RDR2: Valentine Canyon warm crimson/sandstone stratigraphic contours + shimmering canyon river
      color += mix(uSecondaryColor, uPrimaryColor, majorContour * 0.65 + elevNorm * 0.35) *
        (minorContour * 0.5 + majorContour * 0.86) * contourBoost;

      float riverX = sin(vLocalPos.z * 1.85) * 0.34;
      float riverDist = abs(vLocalPos.x - riverX);
      float riverGlow = (1.0 - smoothstep(0.04, 0.16, riverDist)) * (0.55 + 0.25 * sin(vLocalPos.z * 16.0 - uTime * 2.4));
      tacticalMark = riverGlow * 0.68;
      tacticalColor = uSecondaryColor;
    } else {
      // APEX: World's Edge crisp volcanic contours + pulsing molten crimson tectonic lava fissure
      color += mix(uSecondaryColor, uPrimaryColor, majorContour * 0.72 + (1.0 - elevNorm) * 0.35) *
        (minorContour * 0.46 + majorContour * 0.82) * contourBoost;

      float fissureCurve = 0.44 * vLocalPos.x + 0.08 * sin(vLocalPos.x * 3.4);
      float fissureDist = abs(vLocalPos.z - fissureCurve);
      float lavaPulse = 0.78 + 0.22 * sin(uTime * 3.0 - vLocalPos.x * 5.0);
      float lavaCore = (1.0 - smoothstep(0.015, 0.11, fissureDist)) * lavaPulse;
      float lavaHalo = (1.0 - smoothstep(0.05, 0.24, fissureDist)) * 0.45 * lavaPulse;
      tacticalMark = clamp(lavaCore + lavaHalo, 0.0, 1.0);
      tacticalColor = mix(uPrimaryColor, vec3(1.0, 0.45, 0.22), lavaCore * 0.65);
    }

    // Apply tactical overlays, subtle grid, 360 radar sweep, and Fresnel glass rim
    color += tacticalColor * tacticalMark;
    color += uPrimaryColor * gridLine;
    color += uPrimaryColor * sweepTrail * 0.22;
    color += mix(uPrimaryColor, vec3(1.0), 0.35) * sweepBeam * 0.55;

    // Subtle Fresnel glass edge glow + circular outer hologram boundary ring
    float outerRim = smoothstep(0.84, 0.99, rNorm);
    float outerRingLine = smoothstep(0.965, 0.985, rNorm) * (1.0 - smoothstep(0.985, 1.0, rNorm));
    color += uPrimaryColor * fresnel * 0.52;
    color += uPrimaryColor * outerRingLine * 0.85;

    // Soft glass translucency (rich solid center, luminous Fresnel perimeter fade)
    float edgeFade = 1.0 - smoothstep(0.955, 1.0, rNorm);
    float alpha = clamp(0.76 + majorContour * 0.14 + tacticalMark * 0.18 + fresnel * 0.16 + outerRim * 0.12, 0.0, 0.96) * edgeFade;

    // Restrain maximum brightness to avoid white bloom blowout
    color = min(color, vec3(1.18));

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createHologramTerrainMesh(config: HologramTerrainConfig): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  const geo = createSmoothTopographicGeometry(config);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: config.radius },
      uContourDensity: { value: config.contourDensity },
      uSweepSpeed: { value: config.sweepSpeed },
      uMapMode: { value: config.mapMode },
      uPrimaryColor: { value: new THREE.Color(config.primaryHex) },
      uSecondaryColor: { value: new THREE.Color(config.secondaryHex) },
      uBaseGlassColor: { value: new THREE.Color(config.baseGlassHex) },
    },
    vertexShader: HOLOGRAM_TERRAIN_VERTEX_SHADER,
    fragmentShader: HOLOGRAM_TERRAIN_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    wireframe: false,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 1;
  return { mesh, material };
}

/**
 * Animated Curved Trajectory Ribbon (`TubeGeometry` with custom GLSL flowing energy pulse).
 * Zero sphere/dot primitives — the energy pulse travels directly along the ribbon UV.
 */
const TRAJECTORY_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TRAJECTORY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uPhaseOffset;
  uniform vec3 uColor;
  uniform vec3 uPulseColor;
  varying vec2 vUv;

  void main() {
    // Flowing glowing energy packet + crisp tactical dashes
    float head = fract(uTime * uSpeed + uPhaseOffset);
    float dist = fract(head - vUv.x + 1.0);
    float comet = exp(-dist * 7.5);
    float dash = smoothstep(0.2, 0.55, sin(vUv.x * 54.0 - uTime * 4.5));

    // Smooth fade at tube tips
    float endFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);

    vec3 col = mix(uColor, uPulseColor, comet * 0.85);
    float intensity = (0.35 + dash * 0.22 + comet * 0.95) * endFade;
    gl_FragColor = vec4(col * intensity, clamp(intensity * 0.92, 0.0, 0.95));
  }
`;

export function createPulsingTrajectoryRibbon(
  points: THREE.Vector3[],
  primaryHex: string,
  pulseHex: string,
  options?: { radius?: number; speed?: number; phaseOffset?: number; closed?: boolean }
): { mesh: THREE.Mesh; material: THREE.ShaderMaterial } {
  const closed = options?.closed ?? false;
  const curve = new THREE.CatmullRomCurve3(points, closed);
  const geo = new THREE.TubeGeometry(curve, 56, options?.radius ?? 0.015, 8, closed);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: options?.speed ?? 0.42 },
      uPhaseOffset: { value: options?.phaseOffset ?? 0 },
      uColor: { value: new THREE.Color(primaryHex) },
      uPulseColor: { value: new THREE.Color(pulseHex) },
    },
    vertexShader: TRAJECTORY_VERTEX_SHADER,
    fragmentShader: TRAJECTORY_FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 5;
  return { mesh, material };
}

/**
 * Floating 3D Tactical Target Ring (concentric segmented GLSL reticle hovering cleanly above objectives).
 * Built on a pure PlaneGeometry — zero boxes/cylinders/spheres.
 */
const TARGET_RING_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TARGET_RING_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uAccentColor;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    float ang = atan(p.y, p.x);

    // Outer segmented rotating ring
    float outerRing = smoothstep(0.055, 0.012, abs(r - 0.86));
    float outerSegs = smoothstep(-0.15, 0.25, sin(ang * 6.0 + uTime * 1.4));

    // Inner continuous precision ring
    float innerRing = smoothstep(0.04, 0.01, abs(r - 0.56));

    // Expanding subtle sonar ripple
    float pulseR = fract(uTime * 0.55) * 0.92;
    float ripple = smoothstep(0.06, 0.0, abs(r - pulseR)) * (1.0 - pulseR) * 0.72;

    // 4 subtle cardinal crosshair ticks
    float tickX = smoothstep(0.032, 0.008, abs(p.y)) * step(0.62, abs(p.x)) * step(abs(p.x), 0.96);
    float tickY = smoothstep(0.032, 0.008, abs(p.x)) * step(0.62, abs(p.y)) * step(abs(p.y), 0.96);
    float ticks = max(tickX, tickY);

    // Soft center glow
    float core = exp(-r * r * 14.0) * 0.45;

    float mask = outerRing * (0.35 + 0.65 * outerSegs) + innerRing * 0.85 + ripple + ticks * 0.9 + core;
    vec3 col = mix(uColor, uAccentColor, innerRing * 0.35 + ticks * 0.5);
    gl_FragColor = vec4(col, clamp(mask * 0.88, 0.0, 0.95));
  }
`;

export function createTacticalTargetRing(
  size: number,
  primaryHex: string,
  accentHex: string
): { mesh: THREE.Mesh; material: THREE.ShaderMaterial } {
  const geo = new THREE.PlaneGeometry(size, size);
  geo.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(primaryHex) },
      uAccentColor: { value: new THREE.Color(accentHex) },
    },
    vertexShader: TARGET_RING_VERTEX_SHADER,
    fragmentShader: TARGET_RING_FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 4;
  return { mesh, material };
}

/**
 * Vertical Holographic Light-Beam Pin (2 crossed vertical GLSL light-sheet planes + base target ring + crisp objective badge).
 * Uses ZERO CylinderGeometry, ZERO BoxGeometry, ZERO SphereGeometry.
 */
const LIGHT_BEAM_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LIGHT_BEAM_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float dx = abs(vUv.x - 0.5) * 2.0;
    // Razor core laser + soft volumetric halo
    float core = exp(-dx * dx * 42.0);
    float halo = exp(-dx * dx * 6.5) * 0.38;

    // Vertical taper: crisp anchor at bottom, smooth atmospheric fade at top
    float vertFade = smoothstep(0.0, 0.08, vUv.y) * pow(1.0 - vUv.y, 1.25);

    // Rising holographic scanline pulses along the beam
    float scan = 0.72 + 0.28 * sin(vUv.y * 28.0 - uTime * 5.2);
    float alpha = (core + halo) * vertFade * scan;

    vec3 col = mix(uColor, vec3(1.0), core * 0.45);
    gl_FragColor = vec4(col, clamp(alpha * 0.9, 0.0, 0.92));
  }
`;

function createObjectiveLabelTexture(label: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 84;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sleek translucent tactical callout pill
    const x = 14;
    const y = 14;
    const w = canvas.width - 28;
    const h = canvas.height - 28;
    const r = 14;

    ctx.fillStyle = 'rgba(6, 10, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle left indicator bar
    ctx.fillStyle = accentHex;
    ctx.fillRect(x + 12, y + 14, 5, h - 28);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px "Barlow Condensed", "Oswald", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.toUpperCase(), canvas.width / 2 + 6, canvas.height / 2 + 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export interface ObjectiveBeamPinHandle {
  group: THREE.Group;
  beamMaterial: THREE.ShaderMaterial;
  ringMaterial: THREE.ShaderMaterial;
}

export function createObjectiveBeamPin(
  label: string,
  x: number,
  y: number,
  z: number,
  primaryHex: string,
  accentHex: string,
  options?: { height?: number; ringSize?: number }
): ObjectiveBeamPinHandle {
  const height = options?.height ?? 0.68;
  const ringSize = options?.ringSize ?? 0.34;
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Base floating tactical target ring
  const ring = createTacticalTargetRing(ringSize, primaryHex, accentHex);
  ring.mesh.position.y = 0.015;
  group.add(ring.mesh);

  // Two crossed vertical GLSL light-beam sheets (zero CylinderGeometry)
  const beamGeo = new THREE.PlaneGeometry(0.16, height);
  const beamMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(primaryHex) },
    },
    vertexShader: LIGHT_BEAM_VERTEX_SHADER,
    fragmentShader: LIGHT_BEAM_FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const sheetA = new THREE.Mesh(beamGeo, beamMaterial);
  sheetA.position.y = height / 2;
  sheetA.renderOrder = 6;
  const sheetB = new THREE.Mesh(beamGeo, beamMaterial);
  sheetB.position.y = height / 2;
  sheetB.rotation.y = Math.PI / 2;
  sheetB.renderOrder = 6;
  group.add(sheetA, sheetB);

  // Crisp floating objective label Sprite at the top of the light beam (always faces camera cleanly)
  const labelTex = createObjectiveLabelTexture(label, primaryHex);
  const spriteMat = new THREE.SpriteMaterial({
    map: labelTex,
    transparent: true,
    depthWrite: false,
  });
  const labelSprite = new THREE.Sprite(spriteMat);
  labelSprite.scale.set(0.56, 0.147, 1);
  labelSprite.position.y = height + 0.06;
  labelSprite.renderOrder = 8;
  group.add(labelSprite);

  return { group, beamMaterial, ringMaterial: ring.material };
}

/**
 * Custom Curved Energy Wall Ribbon (e.g. Apex Ring-3 / Warzone Closing Gas Curtain).
 * Built from a custom open ring-ribbon BufferGeometry (ZERO CylinderGeometry) with GLSL scanline forcefield shader.
 */
const ENERGY_CURTAIN_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // Vertical curtain fade (crisp glowing bottom & top lip, translucent translucent center)
    float bottomEdge = smoothstep(0.0, 0.12, vUv.y);
    float topEdge = smoothstep(1.0, 0.85, vUv.y);
    float lipBoost = smoothstep(0.1, 0.0, vUv.y) * 0.65 + smoothstep(0.88, 1.0, vUv.y) * 0.55;

    // Fine diagonal holographic energy scanlines
    float scan = 0.5 + 0.5 * sin(vUv.y * 42.0 - uTime * 3.6);
    float diag = 0.65 + 0.35 * sin((vUv.x * 36.0 + vUv.y * 8.0) - uTime * 1.8);

    float alpha = (0.14 * bottomEdge * topEdge * (0.65 + 0.35 * scan) * diag) + lipBoost * 0.42;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.72));
  }
`;

export function createEnergyCurtainRibbon(
  radius: number,
  height: number,
  primaryHex: string,
  segments = 64
): { group: THREE.Group; material: THREE.ShaderMaterial } {
  const group = new THREE.Group();

  // Build custom circular ribbon BufferGeometry without using CylinderGeometry
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const angle = u * Math.PI * 2;
    const cos = Math.cos(angle) * radius;
    const sin = Math.sin(angle) * radius;

    positions.push(cos, 0, sin);
    uvs.push(u, 0);

    positions.push(cos, height, sin);
    uvs.push(u, 1);

    if (i < segments) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(primaryHex) },
    },
    vertexShader: LIGHT_BEAM_VERTEX_SHADER,
    fragmentShader: ENERGY_CURTAIN_FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const curtain = new THREE.Mesh(geo, material);
  curtain.renderOrder = 5;
  group.add(curtain);

  // Crisp glowing top & bottom Torus energy lips
  const lipMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(primaryHex),
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const topLip = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 8, segments), lipMat);
  topLip.rotation.x = Math.PI / 2;
  topLip.position.y = height;
  const botLip = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.01, 8, segments), lipMat);
  botLip.rotation.x = Math.PI / 2;
  botLip.position.y = 0.01;
  group.add(topLip, botLip);

  return { group, material };
}
