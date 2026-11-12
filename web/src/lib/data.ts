// 웹 데이터(web/public/data/web.json) 타입 정의와 읽기 함수.
// 원본: claude/paris_etoile.html의 wdata. 팀 분석이 확정되면 web.json만 교체한다(키 이름은 유지).
import raw from "../../public/data/web.json";

/** 반경 500m 별 식당 수 구간: "0곳" | "1~2곳" | "3~5곳" | "6~9곳" | "10곳 이상" */
export type Bin = string;

/** 전체 규모 */
export type Inventory = {
  listings: number; // 에어비앤비 숙소 수
  hotels: number; // 등급 숙박시설 수
  hotels_geo: number; // 그중 좌표가 있는 곳
  restaurants: number; // 별 식당 수
  r3: number;
  r2: number;
  r1: number;
  cluster_listings: number; // 반경 500m 별 식당 6곳 이상 숙소
};

/** 구별 요약 */
export type District = {
  a: number; // 구 번호(1~20)
  name: string; // 구 이름(Inside Airbnb 표기)
  n: number; // 숙소 수
  price: number; // 1박 가격 중앙값(€)
  rev: number; // 추정 연매출 중앙값(€)
  occ: number; // 추정 연간 예약일 중앙값
  pro: number; // 전문 호스트 비율
  cl: number; // 클러스터 숙소 비율
  rest: number; // 별 식당 수
  r3: number;
  r2: number;
  loc: number; // 위치 평점 평균
  hotels: number; // 등급 숙박시설 수
  hi: number; // 4~5성 비율
  top: [name: string, stars: number][]; // 대표 별 식당
};

/** 경도·위도 좌표 */
export type LngLat = [lng: number, lat: number];

/** 별 식당 원본 행 */
export type RestaurantRow = [name: string, stars: number, lng: number, lat: number, arr: number, cuisine: string];

/** 4~5성 숙박시설 원본 행 */
export type HotelRow = [lng: number, lat: number, stars: number];

/**
 * 150m 격자 칸. 칸 왼쪽 아래 모서리 = 경도 2.35 + gx*150/73200, 위도 48.86 + gy*150/110574 (초안 그리기 방식 기준)
 * 2: 숙소 수, 3: 클러스터 숙소 수, 4·5: 초안 화면에서 쓰지 않음(의미 확인 필요)
 */
export type GridCell = [gx: number, gy: number, n: number, cluster: number, v4: number, v5: number];

/** 구간별 가격 프리미엄(0곳 대비, 로그 가격 회귀 → 비율) */
export type PremiumRow = { bin: Bin; pct: number; lo: number; hi: number; t: number };

export type AirbnbBinRow = {
  bin: Bin;
  n: number;
  price_med: number;
  pro: number;
  lux: number;
  loc: number;
  rating: number;
  occ_med: number;
  rev_med: number;
};

export type HotelGroupRow = { group: string; n: number; hi: number; five: number; rooms: number };
export type HotelBinRow = { bin: Bin; n: number; hi: number; five: number };
export type ResidTierRow = { tier: string; n: number; resid_med: number };

export type WebData = {
  inv: Inventory;
  dist: District[];
  /** 구 번호(문자열) → 추정 경계 폴리곤 목록 */
  polys: Record<string, LngLat[][]>;
  grid: GridCell[];
  rest: RestaurantRow[];
  hotels: HotelRow[];
  /** 로그 가격 회귀 계수: const, b_<구간>, rt_<객실 유형>, lacc(log 수용 인원), bed, a_<구 이름> */
  coef: Record<string, number>;
  bins: Bin[];
  premium: PremiumRow[];
  airbnb_bins: AirbnbBinRow[];
  hotel_groups: HotelGroupRow[];
  hotel_bins: HotelBinRow[];
  five: { n: number; near: number; share: number; all_hotels_near: number };
  cl300: { n: number; pct: number; t: number };
  cl1000: { n: number; pct: number; t: number };
  per_rest: { pct: number; t: number };
  rev_gap: { top: string; top_v: number; bot: string; bot_v: number; ratio: number };
  resid_tier: ResidTierRow[];
  loc48: number;
  rating48: number;
};

const data = raw as unknown as WebData;

/** 전체 웹 데이터 */
export function getWebData(): WebData {
  return data;
}

export type Restaurant = {
  name: string;
  stars: number;
  lng: number;
  lat: number;
  arr: number;
  cuisine: string;
};

/** 별 식당을 객체 목록으로 */
export function getRestaurants(): Restaurant[] {
  return data.rest.map(([name, stars, lng, lat, arr, cuisine]) => ({ name, stars, lng, lat, arr, cuisine }));
}

/** 구 이름으로 구 요약 찾기 */
export function findDistrictByName(name: string): District | undefined {
  return data.dist.find((d) => d.name === name);
}

/** 구간 이름으로 가격 프리미엄 찾기 */
export function getPremium(bin: Bin): PremiumRow | undefined {
  return data.premium.find((p) => p.bin === bin);
}
