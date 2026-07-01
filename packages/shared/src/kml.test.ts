import { describe, it, expect } from "vitest";
import { parseKmlPolygons } from "./kml.js";
import { polygonAreaHa } from "./geo.js";

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>North Meadow</name>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>
        -1.262,51.748,0 -1.258,51.748,0 -1.258,51.751,0 -1.262,51.751,0 -1.262,51.748,0
      </coordinates></LinearRing></outerBoundaryIs></Polygon>
    </Placemark>
    <Placemark>
      <name>South Field</name>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>
        -1.260,51.740 -1.256,51.740 -1.256,51.743 -1.260,51.743
      </coordinates></LinearRing></outerBoundaryIs></Polygon>
    </Placemark>
  </Document>
</kml>`;

describe("parseKmlPolygons", () => {
  it("extracts each placemark's name and polygon", () => {
    const placemarks = parseKmlPolygons(KML);
    expect(placemarks).toHaveLength(2);
    expect(placemarks[0]!.name).toBe("North Meadow");
    expect(placemarks[1]!.name).toBe("South Field");
    expect(placemarks[0]!.polygon.type).toBe("Polygon");
  });

  it("closes an unclosed ring", () => {
    const south = parseKmlPolygons(KML)[1]!.polygon.coordinates[0]!;
    expect(south[0]).toEqual(south[south.length - 1]);
  });

  it("handles namespace-prefixed tags", () => {
    const prefixed = `<kml:Placemark><kml:name>P1</kml:name><kml:Polygon><kml:outerBoundaryIs><kml:LinearRing><kml:coordinates>0,0 0,1 1,1 1,0 0,0</kml:coordinates></kml:LinearRing></kml:outerBoundaryIs></kml:Polygon></kml:Placemark>`;
    const out = parseKmlPolygons(prefixed);
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("P1");
    expect(out[0]!.polygon.coordinates[0]).toHaveLength(5);
  });

  it("returns nothing for a KML with no polygons", () => {
    expect(parseKmlPolygons("<kml><Placemark><name>x</name></Placemark></kml>")).toHaveLength(0);
  });
});

describe("polygonAreaHa", () => {
  it("computes a plausible hectare area for the parsed AOI", () => {
    const meadow = parseKmlPolygons(KML)[0]!.polygon;
    const ha = polygonAreaHa(meadow);
    // ~0.004deg x 0.003deg near 51.75N is roughly 8 ha.
    expect(ha).toBeGreaterThan(5);
    expect(ha).toBeLessThan(12);
  });
});
