import { z } from "zod";

/**
 * Minimal GeoJSON used across BioCoda. Parcels are stored as PostGIS
 * geometries (SRID 4326); the API surfaces them as GeoJSON for MapLibre.
 */

export const PositionSchema = z.tuple([z.number(), z.number()]); // [lng, lat]
export type Position = z.infer<typeof PositionSchema>;

/** A single linear ring; first and last positions should coincide. */
export const LinearRingSchema = z.array(PositionSchema).min(4);

export const PolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(LinearRingSchema).min(1),
});
export type Polygon = z.infer<typeof PolygonSchema>;

export const PointSchema = z.object({
  type: z.literal("Point"),
  coordinates: PositionSchema,
});
export type Point = z.infer<typeof PointSchema>;

/** [west, south, east, north] */
export const BBoxSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);
export type BBox = z.infer<typeof BBoxSchema>;

/** Centroid of a polygon's outer ring (good enough for map pins / labels). */
export function centroid(polygon: Polygon): Position {
  const ring = polygon.coordinates[0]!;
  // Drop the closing duplicate vertex if present.
  const pts =
    ring.length > 1 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  let x = 0;
  let y = 0;
  for (const [lng, lat] of pts) {
    x += lng;
    y += lat;
  }
  return [x / pts.length, y / pts.length];
}

/** Approximate geodesic area of a polygon's outer ring, in hectares. */
export function polygonAreaHa(polygon: Polygon): number {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return 0;
  const R = 6378137; // WGS84 equatorial radius, metres
  const rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i]!;
    const [lng2, lat2] = ring[i + 1]!;
    sum += (lng2 - lng1) * rad * (2 + Math.sin(lat1 * rad) + Math.sin(lat2 * rad));
  }
  const areaM2 = Math.abs((sum * R * R) / 2);
  return Math.round((areaM2 / 10_000) * 100) / 100;
}

/** Axis-aligned bounding box of a polygon. */
export function bbox(polygon: Polygon): BBox {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const ring of polygon.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < w) w = lng;
      if (lng > e) e = lng;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    }
  }
  return [w, s, e, n];
}
