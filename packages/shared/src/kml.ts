import type { Polygon } from "./geo.js";

/**
 * Minimal KML polygon parser.
 *
 * Pulls Placemark boundaries out of a KML document (the format Google Earth,
 * QGIS, and most GIS tools export) and returns them as GeoJSON polygons, so an
 * uploaded Area of Interest can drive the map and the real Sentinel-2 EO with no
 * extra tooling. Tolerant of namespace prefixes and missing altitude values;
 * uses each Placemark's first (outer) polygon ring. Pure string parsing, so it
 * runs in the browser and in Node tests without a DOM.
 */
export interface KmlPlacemark {
  name: string | null;
  polygon: Polygon;
}

function tag(name: string): RegExp {
  return new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i");
}

function parseCoords(block: string): [number, number][] {
  const pts: [number, number][] = [];
  for (const token of block.trim().split(/\s+/)) {
    if (!token) continue;
    const parts = token.split(",");
    const lng = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) pts.push([lng, lat]);
  }
  return pts;
}

function ringToPolygon(pts: [number, number][]): Polygon | null {
  if (pts.length < 3) return null;
  const ring = [...pts];
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
  if (ring.length < 4) return null;
  return { type: "Polygon", coordinates: [ring] };
}

export function parseKmlPolygons(kml: string): KmlPlacemark[] {
  const out: KmlPlacemark[] = [];
  const placemarks = kml.match(/<(?:\w+:)?Placemark\b[\s\S]*?<\/(?:\w+:)?Placemark>/gi) ?? [];
  const blocks = placemarks.length ? placemarks : [kml];
  for (const block of blocks) {
    const nameMatch = placemarks.length ? block.match(tag("name")) : null;
    const name = nameMatch ? nameMatch[1]!.trim() || null : null;
    const polyMatch = block.match(/<(?:\w+:)?Polygon\b[\s\S]*?<\/(?:\w+:)?Polygon>/i);
    const scope = polyMatch ? polyMatch[0] : block;
    const coordsMatch = scope.match(tag("coordinates"));
    if (!coordsMatch) continue;
    const polygon = ringToPolygon(parseCoords(coordsMatch[1]!));
    if (polygon) out.push({ name, polygon });
  }
  return out;
}
