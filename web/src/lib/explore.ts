// 탐색 화면 계산: 지표 정의, 단계 구분, 반경 민감도
import type { District, GridCell, HotelRow, LngLat, Restaurant, WebData } from "./data";
import { formatEuro, formatPct } from "./format";

export type MetricKey = "rest" | "cl" | "price" | "rev" | "pro";
export type Stars = 1 | 2 | 3;
export type RadiusM = 300 | 500 | 1000;

export type Metric = {
  label: string;
  steps: number[]; // 단계 시작값(초안 기준)
  fmt: (v: number) => string;
};

export const METRICS: Record<MetricKey, Metric> = {
  rest: { label: "별 식당 수", steps: [0, 1, 4, 10, 16], fmt: (v) => `${v}곳` },
  cl: { label: "클러스터 숙소 비중", steps: [0, 0.001, 0.05, 0.2, 0.5], fmt: (v) => formatPct(v, { digits: 0 }) },
  price: { label: "1박 가격 중앙값", steps: [0, 150, 200, 250, 320], fmt: (v) => formatEuro(v) },
  rev: { label: "추정 연매출 중앙값", steps: [0, 10000, 15000, 20000, 26000], fmt: (v) => formatEuro(v) },
  pro: { label: "전문 호스트 비중", steps: [0, 0.1, 0.2, 0.3, 0.4], fmt: (v) => formatPct(v, { digits: 0 }) },
};
export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

/** 구 색칠: 회색 5단계 */
export const GREY_RAMP = ["#f2f2f2", "#d9d9d9", "#b8b8b8", "#8c8c8c", "#5c5c5c"];

export function level(v: number, steps: number[]): number {
  let l = 0;
  for (let i = 1; i < steps.length; i++) if (v >= steps[i]) l = i;
  return l;
}

/** 선택한 별 등급만 구별로 센다 */
export function countByDistrict(restaurants: Restaurant[], stars: Stars[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const r of restaurants) if (stars.includes(r.stars as Stars)) out[r.arr] = (out[r.arr] ?? 0) + 1;
  return out;
}

export function metricValue(d: District, key: MetricKey, restCount: Record<number, number>): number {
  return key === "rest" ? (restCount[d.a] ?? 0) : d[key];
}

/** 반경별 민감도: 반경 안 별 식당 10곳 이상 숙소의 가격 프리미엄(0곳 대비) */
export function sensitivity(w: Pick<WebData, "cl300" | "cl1000" | "premium" | "airbnb_bins">) {
  const top = w.premium[w.premium.length - 1];
  const topN = w.airbnb_bins[w.airbnb_bins.length - 1].n;
  return [
    { radius: 300 as RadiusM, pct: w.cl300.pct, n: w.cl300.n },
    { radius: 500 as RadiusM, pct: top.pct, n: topN },
    { radius: 1000 as RadiusM, pct: w.cl1000.pct, n: w.cl1000.n },
  ];
}

/** 클러스터 격자 칸(150m) 폴리곤. 좌표는 칸의 왼쪽 아래 모서리 */
export function gridCellRing([gx, gy]: GridCell): LngLat[] {
  const lng = 2.35 + (gx * 150) / 73200;
  const lat = 48.86 + (gy * 150) / 110574;
  const dx = 150 / 73200;
  const dy = 150 / 110574;
  return [
    [lng, lat],
    [lng + dx, lat],
    [lng + dx, lat + dy],
    [lng, lat + dy],
    [lng, lat],
  ];
}

/** 탐색 화면에 넘길 데이터 */
export type ExploreData = {
  dist: District[];
  polys: Record<string, LngLat[][]>;
  restaurants: Restaurant[];
  hotels: HotelRow[];
  clusterCells: GridCell[]; // 클러스터 숙소가 있는 칸만
  sensitivity: ReturnType<typeof sensitivity>;
};
