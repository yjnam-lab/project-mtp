"use client";

// 탐색 지도: 구 색칠(회색 단계), 별 식당·반경 원·클러스터 격자·4~5성 호텔 층
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GridCell, HotelRow, LngLat, Restaurant } from "@/lib/data";
import { GREY_RAMP, gridCellRing } from "@/lib/explore";
import { BRAND, circleRing, INK, isCoarsePointer, MAP_STYLE_URL, MAX_BOUNDS, PARIS_BOUNDS } from "@/lib/map";

export type Layers = { rest: boolean; rings: boolean; cluster: boolean; hotel: boolean };

type Props = {
  polys: Record<string, LngLat[][]>;
  /** 구 번호 → { 단계, 툴팁 문구 } */
  districts: Record<number, { level: number; tip: string }>;
  selected: number;
  onSelect: (a: number) => void;
  restaurants: Restaurant[]; // 별 등급 필터 적용 후
  hotels: HotelRow[];
  clusterCells: GridCell[];
  radius: number;
  layers: Layers;
};

const fc = <G extends GeoJSON.Geometry>(features: GeoJSON.Feature<G>[]): GeoJSON.FeatureCollection<G> => ({
  type: "FeatureCollection",
  features,
});

function districtsGeo(polys: Props["polys"], districts: Props["districts"], selected: number) {
  return fc(
    Object.entries(polys).map(([a, rings]) => ({
      type: "Feature" as const,
      properties: { a: Number(a), level: districts[Number(a)]?.level ?? 0, sel: Number(a) === selected ? 1 : 0 },
      geometry: { type: "Polygon" as const, coordinates: rings },
    })),
  );
}

const restGeo = (list: Restaurant[]) =>
  fc(
    list.map((r) => ({
      type: "Feature" as const,
      properties: { name: r.name, stars: r.stars, cuisine: r.cuisine },
      geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
    })),
  );

const ringsGeo = (list: Restaurant[], radius: number) =>
  fc(
    list.map((r) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Polygon" as const, coordinates: [circleRing(r.lng, r.lat, radius, 48)] },
    })),
  );

const hotelGeo = (list: HotelRow[]) =>
  fc(
    list.map(([lng, lat, stars]) => ({
      type: "Feature" as const,
      properties: { stars },
      geometry: { type: "Point" as const, coordinates: [lng, lat] },
    })),
  );

const clusterGeo = (cells: GridCell[]) =>
  fc(
    cells.map((c) => ({
      type: "Feature" as const,
      properties: { share: c[2] ? c[3] / c[2] : 0 },
      geometry: { type: "Polygon" as const, coordinates: [gridCellRing(c)] },
    })),
  );

function centerOf(ring: LngLat[]): LngLat {
  const s = ring.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [s[0] / ring.length, s[1] / ring.length];
}

export function ExploreMap(props: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const labelsRef = useRef<Record<number, HTMLElement>>({});
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // 지도 생성(한 번)
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    const markers: Marker[] = [];
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !boxRef.current) return;
      map = new maplibregl.Map({
        container: boxRef.current,
        style: MAP_STYLE_URL,
        bounds: PARIS_BOUNDS,
        fitBoundsOptions: { padding: 16 },
        minZoom: 10.5,
        maxBounds: MAX_BOUNDS,
        attributionControl: { compact: true },
        cooperativeGestures: isCoarsePointer(),
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

      map.on("load", () => {
        if (!map) return;
        const p = latest.current;
        map.addSource("dist", { type: "geojson", data: districtsGeo(p.polys, p.districts, p.selected) });
        map.addSource("cluster", { type: "geojson", data: clusterGeo(p.clusterCells) });
        map.addSource("rings", { type: "geojson", data: ringsGeo(p.restaurants, p.radius) });
        map.addSource("hotel", { type: "geojson", data: hotelGeo(p.hotels) });
        map.addSource("rest", { type: "geojson", data: restGeo(p.restaurants) });

        map.addLayer({
          id: "dist-fill",
          type: "fill",
          source: "dist",
          paint: {
            "fill-color": ["match", ["get", "level"], 0, GREY_RAMP[0], 1, GREY_RAMP[1], 2, GREY_RAMP[2], 3, GREY_RAMP[3], GREY_RAMP[4]],
            "fill-opacity": 0.62,
          },
        });
        map.addLayer({ id: "dist-line", type: "line", source: "dist", paint: { "line-color": "#ffffff", "line-width": 1.2 } });
        map.addLayer({
          id: "cluster",
          type: "fill",
          source: "cluster",
          paint: { "fill-color": INK, "fill-opacity": ["+", 0.3, ["*", 0.5, ["get", "share"]]] },
        });
        map.addLayer({ id: "rings", type: "fill", source: "rings", paint: { "fill-color": BRAND, "fill-opacity": 0.07 } });
        map.addLayer({
          id: "rings-line",
          type: "line",
          source: "rings",
          paint: { "line-color": BRAND, "line-width": 0.8, "line-opacity": 0.35 },
        });
        map.addLayer({
          id: "dist-sel",
          type: "line",
          source: "dist",
          filter: ["==", ["get", "sel"], 1],
          paint: { "line-color": INK, "line-width": 3 },
        });
        map.addLayer({
          id: "hotel",
          type: "circle",
          source: "hotel",
          paint: {
            "circle-radius": ["match", ["get", "stars"], 5, 3.2, 2.2],
            "circle-color": INK,
            "circle-opacity": 0.6,
          },
        });
        map.addLayer({
          id: "rest",
          type: "circle",
          source: "rest",
          paint: {
            "circle-radius": ["match", ["get", "stars"], 3, 7, 2, 5.5, 4],
            "circle-color": BRAND,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.3,
          },
        });

        // 구 번호 표시(HTML 라벨: 글꼴을 Pretendard로 맞춤)
        for (const [a, rings] of Object.entries(p.polys)) {
          const el = document.createElement("div");
          el.textContent = a;
          el.className = "pointer-events-none text-xs font-bold text-foreground/70 tabular-nums";
          labelsRef.current[Number(a)] = el;
          markers.push(new maplibregl.Marker({ element: el }).setLngLat(centerOf(rings[0])).addTo(map));
        }

        readyRef.current = true;
        applyAll();
      });

      map.on("click", (e) => {
        if (!map) return;
        const f = map.queryRenderedFeatures(e.point, { layers: ["dist-fill"] })[0];
        if (f) latest.current.onSelect(Number(f.properties.a));
      });
      map.on("mousemove", (e) => {
        if (!map) return;
        const r = map.queryRenderedFeatures(e.point, { layers: ["rest"] })[0];
        const d = map.queryRenderedFeatures(e.point, { layers: ["dist-fill"] })[0];
        map.getCanvas().style.cursor = r || d ? "pointer" : "";
        if (r) {
          const { name, stars, cuisine } = r.properties as { name: string; stars: number; cuisine: string };
          popup.setLngLat(e.lngLat).setText(`${"★".repeat(stars)} ${name} · ${cuisine}`).addTo(map);
        } else if (d) {
          popup.setLngLat(e.lngLat).setText(latest.current.districts[Number(d.properties.a)]?.tip ?? "").addTo(map);
        } else popup.remove();
      });
      map.on("mouseout", () => popup.remove());
    })();
    return () => {
      cancelled = true;
      readyRef.current = false;
      markers.forEach((m) => m.remove());
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  function applyAll() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const p = latest.current;
    const src = (id: string) => map.getSource(id) as GeoJSONSource | undefined;
    src("dist")?.setData(districtsGeo(p.polys, p.districts, p.selected));
    src("rest")?.setData(restGeo(p.restaurants));
    src("rings")?.setData(ringsGeo(p.restaurants, p.radius));
    const vis = (on: boolean) => (on ? "visible" : "none");
    map.setLayoutProperty("rest", "visibility", vis(p.layers.rest));
    map.setLayoutProperty("rings", "visibility", vis(p.layers.rings));
    map.setLayoutProperty("rings-line", "visibility", vis(p.layers.rings));
    map.setLayoutProperty("cluster", "visibility", vis(p.layers.cluster));
    map.setLayoutProperty("hotel", "visibility", vis(p.layers.hotel));
    for (const [a, el] of Object.entries(labelsRef.current)) {
      const lv = p.districts[Number(a)]?.level ?? 0;
      el.style.color = Number(a) === p.selected ? BRAND : lv >= 3 ? "#ffffff" : "";
    }
  }

  const { districts, selected, restaurants, radius, layers } = props;
  useEffect(() => {
    applyAll();
  }, [districts, selected, restaurants, radius, layers]);

  return (
    <div
      ref={boxRef}
      className="h-[64vh] max-h-[640px] min-h-[380px] w-full bg-muted lg:h-[640px]"
      role="application"
      aria-label="파리 20개 구 지도. 구를 누르면 오른쪽에 구 요약이 나옵니다"
    />
  );
}
