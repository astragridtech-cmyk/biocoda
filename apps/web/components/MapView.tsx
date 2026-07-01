"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import type { Polygon } from "@biocoda/shared";

export interface MapParcel {
  id: string;
  name: string;
  /** Fill/dot colour for the active attribute layer, decided by the caller. */
  color: string;
  geom: Polygon;
}

type BasemapId = "satellite" | "sentinel" | "light";

/**
 * Basemaps. All keyless. "sentinel" is the Copernicus Sentinel-2 cloudless
 * mosaic (EOX s2cloudless), so the satellite context on screen is the same
 * source family the EO condition signal is derived from.
 */
const BASEMAPS: Record<
  BasemapId,
  { label: string; tiles: string[]; attribution: string; maxzoom: number }
> = {
  satellite: {
    label: "Satellite",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    maxzoom: 19,
  },
  sentinel: {
    label: "Sentinel-2",
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg"],
    attribution: "Sentinel-2 cloudless 2021 by EOX. Contains modified Copernicus Sentinel data.",
    maxzoom: 16,
  },
  light: {
    label: "Light",
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg"],
    attribution: "Terrain Light by EOX. Contains modified Copernicus data and OpenStreetMap.",
    maxzoom: 16,
  },
};
const BASEMAP_ORDER: BasemapId[] = ["satellite", "sentinel", "light"];

function buildData(parcels: MapParcel[]) {
  const fc = {
    type: "FeatureCollection" as const,
    features: parcels.map((p) => ({
      type: "Feature" as const,
      id: p.id,
      properties: { id: p.id, name: p.name, color: p.color },
      geometry: p.geom,
    })),
  };
  const points = {
    type: "FeatureCollection" as const,
    features: parcels.map((p) => ({
      type: "Feature" as const,
      id: p.id,
      properties: { id: p.id, name: p.name, color: p.color },
      geometry: { type: "Point" as const, coordinates: centroidOf(p.geom) },
    })),
  };
  return { fc, points };
}

/**
 * Parcel map. Parcel polygons are coloured by the caller (the active attribute
 * layer: condition, habitat, EO recency, or verification) via a per-feature
 * `color` property, drawn over a switchable basemap. The map is created once and
 * its data updated in place, so the year scrubber and layer toggles recolour
 * parcels every tick without rebuilding the map. Click opens the parcel.
 */
export function MapView({
  parcels,
  onSelect,
}: {
  parcels: MapParcel[];
  /** When provided, a marker click calls this (drawer) instead of navigating. */
  onSelect?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const parcelsRef = useRef(parcels);
  parcelsRef.current = parcels;
  const [basemap, setBasemap] = useState<BasemapId>("satellite");

  // Create the map once.
  useEffect(() => {
    if (!ref.current) return;
    const { fc, points } = buildData(parcelsRef.current);

    const bounds = new maplibregl.LngLatBounds();
    for (const p of parcelsRef.current) {
      for (const ring of p.geom.coordinates) {
        for (const [lng, lat] of ring) bounds.extend([lng, lat]);
      }
    }
    const fit = () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 44, maxZoom: 12, duration: 0 });
      }
    };

    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: Object.fromEntries(
          BASEMAP_ORDER.map((id) => [
            id,
            {
              type: "raster" as const,
              tiles: BASEMAPS[id].tiles,
              tileSize: 256,
              maxzoom: BASEMAPS[id].maxzoom,
              attribution: BASEMAPS[id].attribution,
            },
          ]),
        ),
        layers: BASEMAP_ORDER.map((id) => ({
          id: `bm-${id}`,
          type: "raster" as const,
          source: id,
          layout: { visibility: id === "satellite" ? ("visible" as const) : ("none" as const) },
        })),
      },
      center: [-1.5, 52],
      zoom: 5,
      attributionControl: { compact: true },
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const ro = new ResizeObserver(() => {
      map.resize();
      fit();
    });
    ro.observe(ref.current);

    map.on("load", () => {
      map.addSource("parcels", { type: "geojson", data: fc });
      map.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "parcels",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.5 },
      });
      map.addLayer({
        id: "parcel-line",
        type: "line",
        source: "parcels",
        // Bright outline reads cleanly over satellite imagery.
        paint: { "line-color": "#ffffff", "line-width": 1.4, "line-opacity": 0.9 },
      });
      map.addSource("parcel-points", { type: "geojson", data: points });
      map.addLayer({
        id: "parcel-dot",
        type: "circle",
        source: "parcel-points",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5.5, 11, 9, 13, 0],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 11, 1, 13, 0],
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 11, 1, 13, 0],
        },
      });

      fit();
      readyRef.current = true;

      for (const layer of ["parcel-fill", "parcel-dot"]) {
        map.on("click", layer, (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined;
          if (!id) return;
          if (onSelectRef.current) onSelectRef.current(id);
          else routerRef.current.push(`/parcels/${id}`);
        });
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
    });

    return () => {
      ro.disconnect();
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // Create once; data updates handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source data in place when colour/year changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const { fc, points } = buildData(parcels);
    (map.getSource("parcels") as maplibregl.GeoJSONSource | undefined)?.setData(fc);
    (map.getSource("parcel-points") as maplibregl.GeoJSONSource | undefined)?.setData(points);
  }, [parcels]);

  // Switch the active basemap.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const id of BASEMAP_ORDER) {
      map.setLayoutProperty(`bm-${id}`, "visibility", id === basemap ? "visible" : "none");
    }
  }, [basemap]);

  return (
    <div className="relative">
      <div ref={ref} className="h-[440px] w-full overflow-hidden rounded-xl" />
      <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded-lg border border-line bg-white/95 text-[11px] shadow-sm backdrop-blur">
        {BASEMAP_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setBasemap(id)}
            className={
              basemap === id
                ? "bg-moss px-2.5 py-1 font-semibold text-white"
                : "px-2.5 py-1 font-medium text-muted hover:bg-panel"
            }
          >
            {BASEMAPS[id].label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Centroid of a polygon's outer ring as [lng, lat]. */
function centroidOf(geom: Polygon): [number, number] {
  const ring = geom.coordinates[0]!;
  const pts =
    ring.length > 1 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  let x = 0;
  let y = 0;
  for (const [lng, lat] of pts) {
    x += lng!;
    y += lat!;
  }
  return [x / pts.length, y / pts.length];
}
