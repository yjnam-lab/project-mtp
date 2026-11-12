// 지도 공통 설정: MapLibre GL + OpenFreeMap(무료, 키 없음) Positron 스타일

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const BRAND = "#d0102b";
export const INK = "#111111";
export const MUTED = "#9a9a9a";

/** 지도 이동 한계(파리와 인접 지역) */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [2.12, 48.76],
  [2.55, 48.95],
];
/** 파리 시내 전체가 보이는 범위 */
export const PARIS_BOUNDS: [[number, number], [number, number]] = [
  [2.224, 48.815],
  [2.47, 48.902],
];

/** 중심·반경(m)으로 원 모양 폴리곤 좌표 */
export function circleRing(lng: number, lat: number, radius: number, steps = 64): [number, number][] {
  const coords: [number, number][] = [];
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return coords;
}

export function circlePolygon(lng: number, lat: number, radius: number): GeoJSON.Feature<GeoJSON.Polygon> {
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circleRing(lng, lat, radius)] } };
}

/** 터치 기기에서는 두 손가락으로만 지도 이동(페이지 스크롤 방해 방지) */
export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}
