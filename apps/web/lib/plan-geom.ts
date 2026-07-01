import type { Polygon } from "@biocoda/shared";

/**
 * Synthetic geometry for imported parcels.
 *
 * Management plans rarely ship machine-readable boundaries, so newly imported
 * parcels get a placeholder square near a site centre, sized from the stated
 * area. They surface as "Awaiting EO" until a real boundary and EO baseline are
 * captured. Real boundary import (GeoJSON / shapefile) is a follow-up.
 */
const SITE_CENTRE: [number, number] = [-0.92, 51.83]; // Willowmere, Downshire

/** Rough inverse of the seed's area model: edge (deg) from area (ha) at ~52N. */
function edgeForArea(areaHa: number): number {
  return Math.sqrt(Math.max(0.05, areaHa) / 760_000);
}

export function synthSquare(index: number, areaHa: number): Polygon {
  const clng = SITE_CENTRE[0] + (index % 4) * 0.004;
  const clat = SITE_CENTRE[1] + Math.floor(index / 4) * 0.004;
  const h = edgeForArea(areaHa) / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [clng - h, clat - h],
        [clng + h, clat - h],
        [clng + h, clat + h],
        [clng - h, clat + h],
        [clng - h, clat - h],
      ],
    ],
  };
}
