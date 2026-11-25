import * as THREE from 'three';
import type { MotionGraphicArchetype } from '../../agents/motionCoachAgent';

/**
 * Generates a Lumen-grade Dark Studio / City-Night HDRI environment texture
 * using PMREMGenerator so metallic & clearcoat carbon-glass reflections glide
 * vividly across the 3D controller without causing white blowout.
 */
export function createDarkStudioHdri(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050914);

  // Overhead soft studio key strip (crisp specular highlight band)
  const overheadStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4.2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.9, 3.1, 3.5), side: THREE.DoubleSide })
  );
  overheadStrip.position.set(0, 6.2, 2.2);
  overheadStrip.rotation.x = Math.PI / 2;
  envScene.add(overheadStrip);

  // Soft front-top fill card so sculpted controller face bevels read with Lumen depth
  const frontFill = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 5.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 1.05, 1.25), side: THREE.DoubleSide })
  );
  frontFill.position.set(0, 2.4, 8.5);
  frontFill.lookAt(0, 0, 0);
  envScene.add(frontFill);

  // Left emerald stadium/cyber softbox
  const emeraldPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(8.5, 5.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 2.6, 1.65), side: THREE.DoubleSide })
  );
  emeraldPanel.position.set(-7.2, 2.2, 3.2);
  emeraldPanel.lookAt(0, 0, 0);
  envScene.add(emeraldPanel);

  // Right cool cyan rim softbox
  const cyanPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(8.5, 5.5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 1.95, 2.85), side: THREE.DoubleSide })
  );
  cyanPanel.position.set(7.2, 2.6, -1.5);
  cyanPanel.lookAt(0, 0, 0);
  envScene.add(cyanPanel);

  // Subtle city-horizon accent light bars for realistic reflections when controller tilts
  const skylineCols = [0x10b981, 0x38bdf8, 0x6366f1, 0x34d399, 0x0ea5e9];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 10.5;
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 2.6 + (i % 3) * 0.9),
      new THREE.MeshBasicMaterial({
        color: skylineCols[i % skylineCols.length],
        side: THREE.DoubleSide,
      })
    );
    bar.position.set(Math.cos(angle) * radius, 0.8 + (i % 2) * 0.7, Math.sin(angle) * radius);
    bar.lookAt(0, 0.5, 0);
    envScene.add(bar);
  }

  // Subtle dark-emerald ground bounce card
  const floorCard = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.24, 0.19), side: THREE.DoubleSide })
  );
  floorCard.position.set(0, -5.5, 0);
  floorCard.rotation.x = -Math.PI / 2;
  envScene.add(floorCard);

  const envRT = pmrem.fromScene(envScene, 0.045);

  // Dispose temporary envScene geometries & materials
  envScene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();

  return envRT.texture;
}

export interface CarbonFiberMaps {
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  dispose: () => void;
}

/**
 * Procedurally synthesizes seamless diagonal 2x2 twill carbon-fiber normal & roughness maps
 * in linear space so Lumen clearcoat & specular highlights glint realistically across curved shells.
 */
export function createCarbonFiberMaps(maxAnisotropy: number): CarbonFiberMaps {
  const size = 128;
  const normalData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);

  const cell = 8; // 8px weave stride
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const u = (x % cell) / cell;
      const v = (y % cell) / cell;
      const cellX = Math.floor(x / cell);
      const cellY = Math.floor(y / cell);
      // 2x2 diagonal twill weave pattern
      const twillPhase = (cellX + cellY) % 4;
      const isWarp = twillPhase < 2;

      const arch = isWarp ? Math.sin(u * Math.PI) : Math.sin(v * Math.PI);
      const slopeX = isWarp ? Math.cos(u * Math.PI) * 0.22 : (u - 0.5) * 0.08;
      const slopeY = isWarp ? (v - 0.5) * 0.08 : Math.cos(v * Math.PI) * 0.22;

      // Tangent-space normal encoded [0..255]
      const nx = Math.max(-1, Math.min(1, -slopeX));
      const ny = Math.max(-1, Math.min(1, -slopeY));
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));

      normalData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      // Smooth woven satin carbon roughness
      const roughVal = Math.round((0.18 + (1 - arch) * 0.16 + (isWarp ? 0.0 : 0.04)) * 255);
      roughData[idx] = roughVal;
      roughData[idx + 1] = roughVal;
      roughData[idx + 2] = roughVal;
      roughData[idx + 3] = 255;
    }
  }

  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);
  normalMap.generateMipmaps = true;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.anisotropy = maxAnisotropy;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(4, 4);
  roughnessMap.generateMipmaps = true;
  roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
  roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return {
    normalMap,
    roughnessMap,
    dispose: () => {
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}

export interface ArenaSurfacePbrSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  accentHex: number;
  baseEmissiveHex: number;
  dispose: () => void;
}

function hash2d(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function createProceduralSurfaceNormalAndRoughness(
  variant: MotionGraphicArchetype,
  maxAnisotropy: number
): { normalMap: THREE.DataTexture; roughnessMap: THREE.DataTexture } {
  const size = 128;
  const normalData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = hash2d(x, y);
      const n2 = hash2d(Math.floor(x / 4), Math.floor(y / 4));
      let sx = 0;
      let sy = 0;
      let rough = 0.4;

      if (variant === 'sports_pitch_arc') {
        // Fine stadium grass grain + wet puddle specular pockets
        const puddle = Math.sin(x * 0.09) * Math.cos(y * 0.08) + n2 * 0.35;
        const isWetPuddle = puddle > 0.55;
        sx = (n1 - 0.5) * (isWetPuddle ? 0.14 : 0.65);
        sy = (hash2d(x + 17, y + 31) - 0.5) * (isWetPuddle ? 0.14 : 0.65);
        rough = isWetPuddle ? 0.1 : 0.42 + n1 * 0.18;
      } else if (variant === 'shooter_crosshair_peek') {
        // Textured sandstone / concrete tactical floor slabs with grout seams
        const tileX = x % 32;
        const tileY = y % 32;
        const isSeam = tileX < 2 || tileY < 2;
        sx = isSeam ? 0.55 : (n1 - 0.5) * 0.48;
        sy = isSeam ? 0.55 : (hash2d(x + 11, y + 7) - 0.5) * 0.48;
        rough = isSeam ? 0.82 : 0.52 + n2 * 0.22;
      } else {
        // Wet night asphalt (GTA / Racing) with coarse tarmac micro-grain & reflective puddles
        const puddle = Math.sin(x * 0.07 + y * 0.05) + n2 * 0.4;
        const isWet = puddle > 0.35;
        sx = (n1 - 0.5) * (isWet ? 0.18 : 0.72);
        sy = (hash2d(x + 29, y + 5) - 0.5) * (isWet ? 0.18 : 0.72);
        rough = isWet ? 0.09 : 0.48 + n1 * 0.24;
      }

      const nz = Math.sqrt(Math.max(0.08, 1 - sx * sx - sy * sy));
      normalData[idx] = Math.round((sx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((sy * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      const rByte = Math.round(Math.max(0.06, Math.min(0.95, rough)) * 255);
      roughData[idx] = rByte;
      roughData[idx + 1] = rByte;
      roughData[idx + 2] = rByte;
      roughData[idx + 3] = 255;
    }
  }

  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(3, 2);
  normalMap.generateMipmaps = true;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.anisotropy = maxAnisotropy;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 2);
  roughnessMap.generateMipmaps = true;
  roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
  roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return { normalMap, roughnessMap };
}

/**
 * Creates a complete PBR texture set (albedo + normal + roughness) per game archetype
 * for the beveled 3D Unreal 5.8 Tactical Arena Slab.
 */
export function createArenaSurfacePbrSet(
  variant: MotionGraphicArchetype,
  maxAnisotropy: number
): ArenaSurfacePbrSet {
  const w = 512;
  const h = 320;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  let accentHex = 0x10b981;
  let baseEmissiveHex = 0x052e1e;

  if (variant === 'sports_pitch_arc') {
    accentHex = 0x10b981;
    baseEmissiveHex = 0x064e3b;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#094329');
    grad.addColorStop(0.5, '#0c5233');
    grad.addColorStop(1, '#062c1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Mowed wet stadium turf stripes
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(52,211,153,0.14)' : 'rgba(2,24,15,0.16)';
      ctx.fillRect((i * w) / 10, 0, w / 10, h);
    }

    // Subtle rain sheen highlights
    const sheen = ctx.createRadialGradient(w * 0.55, h * 0.45, 16, w * 0.55, h * 0.45, 220);
    sheen.addColorStop(0, 'rgba(110,231,183,0.18)');
    sheen.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);

    // Crisp stadium chalk markings
    ctx.strokeStyle = 'rgba(209,250,229,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 20, w - 44, h - 40);
    ctx.beginPath();
    ctx.moveTo(w / 2, 20);
    ctx.lineTo(w / 2, h - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(209,250,229,0.9)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    // Penalty boxes & 6-yard boxes
    ctx.strokeRect(22, h * 0.24, 82, h * 0.52);
    ctx.strokeRect(22, h * 0.37, 32, h * 0.26);
    ctx.strokeRect(w - 104, h * 0.24, 82, h * 0.52);
    ctx.strokeRect(w - 54, h * 0.37, 32, h * 0.26);
  } else if (variant === 'shooter_crosshair_peek') {
    accentHex = 0x38bdf8;
    baseEmissiveHex = 0x0c273b;
    // Mirage dusk sandstone & tactical concrete slab
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e1b18');
    grad.addColorStop(0.5, '#2b241d');
    grad.addColorStop(1, '#141926');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Concrete tile seams
    ctx.strokeStyle = 'rgba(251,191,36,0.16)';
    ctx.lineWidth = 1.5;
    for (let x = 32; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 32; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Tactical bombsite A floor perimeter & sightline cone
    ctx.strokeStyle = 'rgba(249,115,22,0.72)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 22, w - 48, h - 44);
    ctx.fillStyle = 'rgba(56,189,248,0.12)';
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 0.72);
    ctx.lineTo(w * 0.84, h * 0.22);
    ctx.lineTo(w * 0.84, h * 0.58);
    ctx.closePath();
    ctx.fill();

    // Subtle tactical corner ticks
    ctx.strokeStyle = 'rgba(56,189,248,0.85)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(w - 116, 44, 72, 72);
  } else if (variant === 'racing_apex_line') {
    accentHex = 0x38bdf8;
    baseEmissiveHex = 0x0a1c30;
    ctx.fillStyle = '#0e131e';
    ctx.fillRect(0, 0, w, h);
    // Wet tarmac corner
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 96;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(36, h - 38);
    ctx.quadraticCurveTo(w * 0.5, 36, w - 36, h - 38);
    ctx.stroke();
    // Red/white apex kerbs
    ctx.strokeStyle = 'rgba(244,63,94,0.8)';
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(46, h - 10);
    ctx.quadraticCurveTo(w * 0.5, 76, w - 46, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Strategy / GTA rainy neon asphalt
    accentHex = 0xec4899;
    baseEmissiveHex = 0x260c2e;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#11131f');
    grad.addColorStop(0.5, '#191326');
    grad.addColorStop(1, '#0c1524');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Asphalt lane markings + wet neon reflections
    ctx.strokeStyle = 'rgba(34,211,238,0.42)';
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 16]);
    ctx.beginPath();
    ctx.moveTo(24, h * 0.5);
    ctx.lineTo(w - 24, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(236,72,153,0.68)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const { normalMap, roughnessMap } = createProceduralSurfaceNormalAndRoughness(variant, maxAnisotropy);

  return {
    map,
    normalMap,
    roughnessMap,
    accentHex,
    baseEmissiveHex,
    dispose: () => {
      map.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Custom GLSL Animated Energy Ribbon Shader for TubeGeometry trajectory arcs & laser sightlines.
 * Features a flowing plasma pulse wave, luminous hot core, and sweet-spot energy surge.
 */
export function createEnergyRibbonShaderMaterial(initialColorHex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0.5 },
      uSweetSpot: { value: 0 },
      uColor: { value: new THREE.Color(initialColorHex) },
      uCoreColor: { value: new THREE.Color(0xd1fae5) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uSweetSpot;
      uniform vec3 uColor;
      uniform vec3 uCoreColor;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        // Flowing light pulses traveling forward along vUv.x
        float streamA = pow(0.5 + 0.5 * sin(vUv.x * 22.0 - uTime * 9.0), 3.0);
        float streamB = pow(0.5 + 0.5 * sin(vUv.x * 46.0 - uTime * 15.0 + vUv.y * 6.2831), 4.0);

        // Bright traveling comet head synchronized to uProgress
        float distToHead = uProgress - vUv.x;
        float cometTail = smoothstep(-0.04, 0.0, distToHead) * exp(-max(0.0, distToHead) * 5.2);
        float headFlash = exp(-abs(distToHead) * 26.0);

        // Cylindrical core-to-edge soft glow
        float core = pow(abs(dot(normalize(vNormal), normalize(vViewDir))), 0.65);

        // Smooth fade at both ribbon tips
        float endFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);

        float energy = (0.38 + streamA * 0.42 + streamB * 0.25 + cometTail * 0.85 + headFlash * 1.15);
        energy *= (1.0 + uSweetSpot * 0.35);

        vec3 col = mix(uColor, uCoreColor, clamp(core * 0.55 + headFlash * 0.75 + uSweetSpot * 0.2, 0.0, 1.0));
        float alpha = clamp(energy * core * endFade * 0.92, 0.0, 1.0);

        gl_FragColor = vec4(col * (0.9 + energy * 0.45), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/**
 * Custom GLSL Fresnel Holographic 3D Tactical Defender Barrier Shader.
 * Renders a volumetric translucent crimson force-field wall with animated scanlines,
 * grazing-angle Fresnel rim glow, and a glowing ground contact seam.
 */
export function createFresnelBarrierShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlert: { value: 0 },
      uColor: { value: new THREE.Color(0xf43f5e) },
      uEdgeColor: { value: new THREE.Color(0xffb4c2) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uAlert;
      uniform vec3 uColor;
      uniform vec3 uEdgeColor;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        // Fresnel edge boost
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 1.9);

        // Vertical fade from glowing floor contact seam upward
        float baseSeam = exp(-vUv.y * 8.5);
        float topFade = smoothstep(1.0, 0.15, vUv.y);
        float sideFade = smoothstep(0.0, 0.07, vUv.x) * smoothstep(1.0, 0.93, vUv.x);

        // Animated tactical holographic scanlines & diagonal chevron pulse
        float scan = 0.65 + 0.35 * sin(vUv.y * 42.0 - uTime * 6.5);
        float pulse = 0.8 + 0.2 * sin(uTime * 5.0 + vUv.x * 8.0);

        float alpha = (baseSeam * 0.95 + (0.22 + fresnel * 0.65) * topFade * scan) * sideFade;
        alpha *= mix(0.62, 1.0, uAlert) * pulse;

        vec3 col = mix(uColor, uEdgeColor, clamp(baseSeam * 0.75 + fresnel * 0.55 + uAlert * 0.2, 0.0, 1.0));
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.96));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/**
 * Custom GLSL Fresnel Vertical Target Light Beam Shader for the holographic destination zone.
 */
export function createFresnelBeamShaderMaterial(initialColorHex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColor: { value: new THREE.Color(initialColorHex) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uColor;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 1.5);
        float bottomSeam = exp(-vUv.y * 6.0);
        float topFade = pow(1.0 - vUv.y, 1.65);
        float risingRing = exp(-abs(fract(vUv.y - uTime * 0.55) - 0.35) * 16.0);

        float alpha = (bottomSeam * 0.68 + fresnel * 0.55 + risingRing * 0.32) * topFade * uIntensity;
        vec3 col = mix(uColor, vec3(0.92, 1.0, 0.97), clamp(bottomSeam * 0.5 + risingRing * 0.45, 0.0, 1.0));
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.9));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export interface SparkTrailSystem {
  points: THREE.Points;
  update: (
    curve: THREE.CatmullRomCurve3,
    arcProgress: number,
    elapsed: number,
    colorHex: number,
    inSweetSpot: boolean
  ) => void;
  dispose: () => void;
}

/**
 * Trailing micro-ember / plasma spark particle system streaming behind the moving pass/shot orb.
 */
export function createSparkTrailSystem(count = 46): SparkTrailSystem {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3); // [trailOffset, lateralJitter, sizeScale]
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    seeds[i * 3] = (i / count) * 0.42; // lag behind orb along curve
    seeds[i * 3 + 1] = (hash2d(i, 3.1) - 0.5) * 2.0; // signed swirl phase
    seeds[i * 3 + 2] = 0.55 + hash2d(i, 9.7) * 0.95; // particle size multiplier
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) sizes[i] = seeds[i * 3 + 2];
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x34d399) },
      uBoost: { value: 1.0 },
    },
    vertexShader: `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;

      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp((28.0 * aSize) / max(1.2, -mvPosition.z), 2.5, 14.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uBoost;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float glow = exp(-d * d * 14.0);
        if (glow < 0.03) discard;
        vec3 col = mix(uColor, vec3(1.0), glow * 0.65);
        gl_FragColor = vec4(col * uBoost, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const _pt = new THREE.Vector3();

  return {
    points,
    update: (curve, arcProgress, elapsed, colorHex, inSweetSpot) => {
      mat.uniforms.uColor.value.setHex(colorHex);
      mat.uniforms.uBoost.value = inSweetSpot ? 1.35 : 1.0;

      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const alphaAttr = geo.getAttribute('aAlpha') as THREE.BufferAttribute;

      for (let i = 0; i < count; i++) {
        const lag = seeds[i * 3];
        const jitter = seeds[i * 3 + 1];
        const t = arcProgress - lag;
        if (t < 0.01 || t > 0.995) {
          alphaAttr.setX(i, 0);
          continue;
        }
        curve.getPointAt(t, _pt);
        const spread = lag * 0.28;
        const swirl = elapsed * 5.2 + i * 1.7;
        posAttr.setXYZ(
          i,
          _pt.x + Math.cos(swirl) * spread * Math.abs(jitter),
          _pt.y + Math.sin(swirl * 0.9) * spread * 0.55 + lag * 0.14,
          _pt.z + Math.sin(swirl) * spread * Math.abs(jitter)
        );
        const fade = Math.max(0, 1 - lag / 0.42);
        alphaAttr.setX(i, fade * fade * (inSweetSpot ? 0.95 : 0.72));
      }

      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}
