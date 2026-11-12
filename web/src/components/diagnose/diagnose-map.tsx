"use client";

// 진단 지도: MapLibre GL + OpenFreeMap(무료, 키 없음) Positron 스타일
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Restaurant } from "@/lib/data";
import { distanceM, RADIUS_M } from "@/lib/diagnose";

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const BRAND = "#d0102b";
const INK = "#111111";

type Point = { lng: number; lat: number };

function circlePolygon({ lng, lat }: Point, radius: number, steps = 72): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

function restaurantsGeo(list: Restaurant[], p: Point): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: list.map((r) => ({
      type: "Feature",
      properties: { name: r.name, stars: r.stars, near: distanceM(p.lng, p.lat, r.lng, r.lat) <= RADIUS_M ? 1 : 0 },
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
    })),
  };
}

function pointGeo(p: Point): GeoJSON.Feature<GeoJSON.Point> {
  return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } };
}

export function DiagnoseMap({
  restaurants,
  point,
  flyToken,
  onSelect,
}: {
  restaurants: Restaurant[];
  point: Point;
  /** 값이 바뀌면 point로 지도를 이동(구 선택 등). 지도 클릭으로 바뀐 경우에는 이동하지 않음 */
  flyToken: number;
  onSelect: (p: Point) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const latest = useRef({ restaurants, point, onSelect });
  useEffect(() => {
    latest.current = { restaurants, point, onSelect };
  });

  // 지도 생성(한 번)
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !boxRef.current) return;
      const { point: p } = latest.current;
      map = new maplibregl.Map({
        container: boxRef.current,
        style: STYLE_URL,
        center: [p.lng, p.lat],
        zoom: 14.3,
        minZoom: 11,
        maxBounds: [
          [2.12, 48.76],
          [2.55, 48.95],
        ],
        attributionControl: { compact: true },
        cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

      map.on("load", () => {
        if (!map) return;
        const { restaurants: list, point: cur } = latest.current;
        map.addSource("radius", { type: "geojson", data: circlePolygon(cur, RADIUS_M) });
        map.addSource("rest", { type: "geojson", data: restaurantsGeo(list, cur) });
        map.addSource("pick", { type: "geojson", data: pointGeo(cur) });
        map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": BRAND, "fill-opacity": 0.07 } });
        map.addLayer({
          id: "radius-line",
          type: "line",
          source: "radius",
          paint: { "line-color": BRAND, "line-width": 1.5, "line-dasharray": [3, 2] },
        });
        map.addLayer({
          id: "rest",
          type: "circle",
          source: "rest",
          paint: {
            "circle-radius": ["match", ["get", "stars"], 3, 8, 2, 6, 4.5],
            "circle-color": ["case", ["==", ["get", "near"], 1], BRAND, "#9a9a9a"],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: "pick",
          type: "circle",
          source: "pick",
          paint: { "circle-radius": 7, "circle-color": INK, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 },
        });
        readyRef.current = true;
      });

      map.on("click", (e) => latest.current.onSelect({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
      map.on("mouseenter", "rest", (e) => {
        if (!map) return;
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const { name, stars } = f.properties as { name: string; stars: number };
        popup
          .setLngLat(f.geometry.coordinates as [number, number])
          .setText(`${"★".repeat(stars)} ${name}`)
          .addTo(map);
      });
      map.on("mouseleave", "rest", () => {
        if (!map) return;
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    })();
    return () => {
      cancelled = true;
      readyRef.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // 선택 위치가 바뀌면 원·식당 강조·핀 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource("radius") as GeoJSONSource | undefined)?.setData(circlePolygon(point, RADIUS_M));
    (map.getSource("rest") as GeoJSONSource | undefined)?.setData(restaurantsGeo(restaurants, point));
    (map.getSource("pick") as GeoJSONSource | undefined)?.setData(pointGeo(point));
  }, [point, restaurants]);

  // 구 선택 등으로 이동 요청
  useEffect(() => {
    if (!flyToken) return;
    mapRef.current?.flyTo({ center: [latest.current.point.lng, latest.current.point.lat], zoom: 14.3, duration: 900 });
  }, [flyToken]);

  return (
    <div
      ref={boxRef}
      className="h-[60vh] max-h-[560px] min-h-[360px] w-full bg-muted lg:h-[560px]"
      role="application"
      aria-label="숙소 위치 선택 지도. 지도를 눌러 위치를 고릅니다"
    />
  );
}
