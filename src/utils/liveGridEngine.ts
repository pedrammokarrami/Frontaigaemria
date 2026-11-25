/**
 * LIVE GRID — real-world map data engine (keyless, zero-cost).
 * Pulls actual buildings + roads around a lat/lng from the OpenStreetMap
 * Overpass API and projects them to screen percentages (equirectangular).
 * This is what makes «لوکیشن واقعی من» render real streets and blocks.
 */

export interface GridCoord {
  lat: number;
  lng: number;
}

export interface GridWay {
  /** flat [lat, lng, lat, lng, …] ring or polyline */
  points: number[];
  /** road class for styling */
  roadClass?: string;
  /** OSM building:levels tag for realistic extrusion height */
  levels?: number;
}

export interface LiveGrid {
  center: GridCoord;
  radiusM: number;
  buildings: GridWay[];
  roads: GridWay[];
  buildingCount: number;
  roadCount: number;
  label: string;
  fetchedAtMs: number;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

function buildQuery(lat: number, lng: number, radiusM: number): string {
  return `[out:json][timeout:40];(
    way["building"](around:${radiusM},${lat},${lng});
    way["highway"](around:${radiusM},${lat},${lng});
  );out geom 800;`;
}

function haversineM(a: GridCoord, b: GridCoord): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceMeters(a: GridCoord, b: GridCoord): number {
  return Math.round(haversineM(a, b));
}

/** Equirectangular projection around center → 0..1 fractions (lng→x, lat→y). */
export function projectToViewport(
  center: GridCoord,
  radiusM: number,
  point: GridCoord
): { xPct: number; yPct: number } {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const dx = (point.lng - center.lng) * mPerDegLng;
  const dy = (point.lat - center.lat) * mPerDegLat;
  const span = radiusM * 2.15; // slight over-zoom so streets bleed past edges
  return {
    xPct: 50 + (dx / span) * 100,
    yPct: 50 - (dy / span) * 100,
  };
}

interface OverpassElement {
  type: string;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export async function fetchLiveGrid(
  center: GridCoord,
  label: string,
  radiusM = 500
): Promise<LiveGrid> {
  const query = buildQuery(center.lat, center.lng, radiusM);
  let lastErr: unknown = null;
  // fast failover: at most 2 endpoints × 14s so the radar never hangs ~2 minutes
  const endpoints = OVERPASS_ENDPOINTS.slice(0, 2);
  for (const endpoint of endpoints) {
    // manual abort: AbortSignal.timeout is missing on older phone browsers and
    // left the loader spinning forever there
    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(new Error('overpass timeout')), 14000);
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AIPETROS-LiveGrid/1.0',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error(`overpass ${resp.status}`);
      const body = (await resp.json()) as { elements?: OverpassElement[] };
      const buildings: GridWay[] = [];
      const roads: GridWay[] = [];
      for (const el of body.elements ?? []) {
        if (!el.geometry || el.geometry.length < 2) continue;
        const flat = el.geometry.flatMap((g) => [g.lat, g.lon]);
        if (el.tags?.building) {
          const lv = parseInt(String(el.tags['building:levels'] ?? ''), 10);
          buildings.push({ points: flat, levels: Number.isFinite(lv) && lv > 0 ? lv : undefined });
        }
        else if (el.tags?.highway) roads.push({ points: flat, roadClass: el.tags.highway });
      }
      // An empty result from a regional mirror (e.g. osm.ch = Swiss-only) must
      // not short-circuit — treat it as failure and try the next endpoint.
      if (buildings.length === 0 && roads.length === 0) {
        throw new Error('empty grid');
      }
      return {
        center,
        radiusM,
        buildings,
        roads,
        buildingCount: buildings.length,
        roadCount: roads.length,
        label,
        fetchedAtMs: Date.now(),
      };
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(abortTimer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('overpass unavailable');
}

/** Preset locations from the user's HUD spec. */
export const LIVE_GRID_PRESETS: Array<{ label: string; lat: number; lng: number; emoji?: string }> = [
  { label: 'تهران (آزادی)', lat: 35.6997, lng: 51.338 },
  { label: 'تهران (ونک)', lat: 35.7542, lng: 51.41 },
  { label: 'قشم', lat: 26.9581, lng: 56.2719 },
  { label: 'NYC (GTA IV)', lat: 40.758, lng: -73.9855 },
];


/**
 * Procedural fallback city (Overpass busy / offline): a Manhattan-style
 * simulation grid so the radar never renders empty. Same LiveGrid shape as
 * real OSM data, so the 3D engine and 2D SVG render it unchanged.
 */
export function buildFallbackGrid(center: GridCoord, label: string, radiusM = 420): LiveGrid {
  const step = 45; // block pitch in meters
  const span = radiusM * 2;
  const buildings: GridWay[] = [];
  const roads: GridWay[] = [];
  const latStep = step / 111_320;
  const lngStep = step / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  const rows = Math.floor(span / step);
  // Streets both directions
  for (let i = -Math.floor(rows / 2); i <= Math.floor(rows / 2); i++) {
    roads.push({
      points: [
        center.lng + i * lngStep, center.lat - span / 2 / 111_320,
        center.lng + i * lngStep, center.lat + span / 2 / 111_320,
      ],
      roadClass: Math.abs(i) % 3 === 0 ? 'secondary' : 'residential',
    });
    roads.push({
      points: [
        center.lng - span / 2 / (111_320 * Math.cos((center.lat * Math.PI) / 180)), center.lat + i * latStep,
        center.lng + span / 2 / (111_320 * Math.cos((center.lat * Math.PI) / 180)), center.lat + i * latStep,
      ],
      roadClass: Math.abs(i) % 3 === 0 ? 'tertiary' : 'residential',
    });
  }
  // Buildings inside each block
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rows; c++) {
      const lat0 = center.lat - span / 2 / 111_320 + r * latStep;
      const lng0 = center.lng - span / 2 / (111_320 * Math.cos((center.lat * Math.PI) / 180)) + c * lngStep;
      const inset = 0.18;
      buildings.push({
        points: [
          lng0 + inset * lngStep, lat0 + inset * latStep,
          lng0 + (1 - inset) * lngStep, lat0 + inset * latStep,
          lng0 + (1 - inset) * lngStep, lat0 + (1 - inset) * latStep,
          lng0 + inset * lngStep, lat0 + (1 - inset) * latStep,
        ],
      });
    }
  }
  return { center, radiusM, label, buildings, roads, buildingCount: buildings.length, roadCount: roads.length, fetchedAtMs: Date.now() };
}
