import {
  centroid,
  hashU32,
  parcelProfile,
  type Parcel,
  type Polygon,
} from "@biocoda/shared";

/**
 * Deterministic seed geometry: ~40 BNG parcels clustered across five English
 * sites. Each parcel is a small square laid out on a grid around its site
 * centre. All coordinates are synthetic, no real holdings.
 */

interface Site {
  key: string;
  name: string;
  centre: [number, number]; // [lng, lat]
  habitats: string[];
}

const SITES: Site[] = [
  {
    key: "ashdown",
    name: "Ashdown Fields",
    centre: [-0.041, 51.06],
    habitats: ["Lowland meadow", "Mixed scrub", "Lowland heathland"],
  },
  {
    key: "severn",
    name: "Severn Levels",
    centre: [-2.55, 51.55],
    habitats: ["Floodplain wetland", "Wet woodland", "Reedbed"],
  },
  {
    key: "wolds",
    name: "Lincolnshire Wolds",
    centre: [-0.18, 53.32],
    habitats: ["Calcareous grassland", "Hedgerow", "Mixed scrub"],
  },
  {
    key: "dartmoor",
    name: "Dartmoor Edge",
    centre: [-3.86, 50.58],
    habitats: ["Upland heathland", "Blanket bog", "Native woodland"],
  },
  {
    key: "broads",
    name: "Broadland Margins",
    centre: [1.49, 52.66],
    habitats: ["Fen meadow", "Grazing marsh", "Reedbed"],
  },
];

const PARCELS_PER_SITE = 8;
const SPACING = 0.0045; // grid spacing between parcel centres (fixed)
// Per-parcel square edge, in degrees. Tuned so areas land in ~0.6–4.5 ha,
// the realistic range for created/enhanced BNG habitat parcels.
const MIN_EDGE = 0.0010;
const MAX_EDGE = 0.0026;

/** Deterministic parcel edge length from its id, spread across the range. */
function parcelEdge(id: string): number {
  const t = (hashU32(id) % 1000) / 1000;
  return MIN_EDGE + t * (MAX_EDGE - MIN_EDGE);
}

function square(
  centre: [number, number],
  col: number,
  row: number,
  edge: number,
): Polygon {
  const [clng, clat] = centre;
  const lng = clng + (col - 1.5) * SPACING;
  const lat = clat + (row - 1.5) * SPACING;
  const h = edge / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - h, lat - h],
        [lng + h, lat - h],
        [lng + h, lat + h],
        [lng - h, lat + h],
        [lng - h, lat - h],
      ],
    ],
  };
}

/** Rough planar area (ha) of a small lat/lng square, fine for a demo. */
function areaHa(geom: Polygon): number {
  const [clng, clat] = centroid(geom);
  const ring = geom.coordinates[0]!;
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  const dLng = Math.max(...lngs) - Math.min(...lngs);
  const dLat = Math.max(...lats) - Math.min(...lats);
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((clat * Math.PI) / 180);
  void clng;
  const m2 = dLng * mPerDegLng * (dLat * mPerDegLat);
  return Math.round((m2 / 10_000) * 100) / 100;
}

export const TENANT_ID = "rb-natural-trust";

/** Stable list of seeded parcels (id `parcel-0` … `parcel-39`). */
export function seedParcels(): Parcel[] {
  const parcels: Parcel[] = [];
  let n = 0;
  for (const site of SITES) {
    for (let i = 0; i < PARCELS_PER_SITE; i++) {
      const id = `parcel-${n}`;
      const col = i % 4;
      const row = Math.floor(i / 4);
      const geom = square(site.centre, col, row, parcelEdge(id));
      const habitat = site.habitats[i % site.habitats.length]!;
      // Spread baseline dates 1–8 years before the demo clock so the portfolio
      // shows parcels at various points in their management period.
      const yearsAgo = 1 + (n % 8);
      const baselineDate = `${2026 - yearsAgo}-04-01`;
      parcels.push({
        id,
        tenantId: TENANT_ID,
        name: `${site.name} ${String.fromCharCode(65 + col)}${row + 1}`,
        habitatType: habitat,
        metricRef: `BM-${id}`,
        geom,
        areaHa: areaHa(geom),
        baselineDate,
      });
      n++;
    }
  }
  return parcels;
}

/** Convenience map for the adapters (parcelId -> habitat/area, baseline date). */
export function parcelLookups(parcels: Parcel[]) {
  const meta: Record<string, { habitatType: string; areaHa: number }> = {};
  const baselines: Record<string, string> = {};
  for (const p of parcels) {
    meta[p.id] = { habitatType: p.habitatType, areaHa: p.areaHa };
    baselines[p.id] = `${p.baselineDate}T00:00:00Z`;
  }
  return { meta, baselines };
}

export { parcelProfile };
