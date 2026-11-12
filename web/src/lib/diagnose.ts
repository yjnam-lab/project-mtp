// 진단 계산(화면과 분리). 원본 로직: claude/paris_etoile.html의 Diagnose
// 점수 정의는 팀 합의 전 임시값이다. 바꿀 때는 locationScore()만 고친다.
import type { AirbnbBinRow, Bin, District, LngLat, PremiumRow, ResidTierRow, Restaurant } from "./data";

export const RADIUS_M = 500;

/** 진단 화면에 필요한 데이터(서버 → 클라이언트로 넘기는 부분) */
export type DiagnoseData = {
  restaurants: Restaurant[];
  polys: Record<string, LngLat[][]>;
  dist: Pick<District, "a" | "name" | "price" | "n">[];
  coef: Record<string, number>;
  bins: Bin[];
  premium: PremiumRow[];
  airbnbBins: AirbnbBinRow[];
  residTier: ResidTierRow[];
};

export type RoomType = "Entire home/apt" | "Private room" | "Hotel room";
export type HostSize = "1" | "2" | "3"; // 숙소 1개 / 2~9개 / 10개 이상

export type DiagnoseInput = {
  lng: number;
  lat: number;
  room: RoomType;
  acc: number; // 수용 인원
  bed: number; // 침실 수
  price: number; // 현재 1박 가격(€), 0이면 비교하지 않음
  host: HostSize;
};

/** 두 좌표 사이 거리(m) */
export function distanceM(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type NearbyRestaurant = Restaurant & { distance: number };

/** 반경 안 별 식당(가까운 순) */
export function nearbyRestaurants(list: Restaurant[], lng: number, lat: number, radius = RADIUS_M): NearbyRestaurant[] {
  return list
    .map((r) => ({ ...r, distance: distanceM(lng, lat, r.lng, r.lat) }))
    .filter((r) => r.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/** 별 식당 수 → 구간 번호(0: 0곳, 1: 1~2곳, 2: 3~5곳, 3: 6~9곳, 4: 10곳 이상) */
export function binIndex(n: number): number {
  return n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4;
}

function inRing(lng: number, lat: number, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 좌표가 속한 구(추정 경계 기준). 파리 밖·숲이면 undefined */
export function districtAt(data: Pick<DiagnoseData, "polys" | "dist">, lng: number, lat: number) {
  for (const [a, rings] of Object.entries(data.polys)) {
    if (rings.some((ring) => inRing(lng, lat, ring))) return data.dist.find((d) => d.a === Number(a));
  }
  return undefined;
}

/** 구 경계 꼭짓점 평균(지도 이동용) */
export function districtCenter(polys: DiagnoseData["polys"], a: number): LngLat | undefined {
  const ring = polys[String(a)]?.[0];
  if (!ring?.length) return undefined;
  const s = ring.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [s[0] / ring.length, s[1] / ring.length];
}

/** 미식 입지 점수(임시): 이 구간 프리미엄 ÷ 최고 구간 프리미엄 × 100 */
export function locationScore(premium: PremiumRow[], bin: number): number {
  const max = premium[premium.length - 1].pct;
  return max > 0 ? Math.round((premium[bin].pct / max) * 100) : 0;
}

/** 로그 가격 회귀로 적정가 추정(€) */
export function fairPrice(
  data: Pick<DiagnoseData, "coef" | "bins">,
  { district, room, acc, bed, bin }: { district: string; room: RoomType; acc: number; bed: number; bin: number },
): number {
  const C = data.coef;
  let lp = C.const;
  if (bin) lp += C[`b_${data.bins[bin]}`] ?? 0;
  if (room !== "Entire home/apt") lp += C[`rt_${room}`] ?? 0;
  lp += C.lacc * Math.log(Math.max(acc, 1)) + C.bed * bed;
  lp += C[`a_${district}`] ?? 0; // 기준 구(Batignolles-Monceau)는 계수 없음
  return Math.exp(lp);
}

export const TIERS = [
  { title: "미식 입지 아님", body: "반경 500m 안에 별 식당이 없습니다. 미식 입지 프리미엄을 기대하기 어려운 위치입니다." },
  { title: "미식 인접 입지", body: "별 식당 1~2곳. 프리미엄이 함께 나타나지만 크지 않습니다." },
  { title: "미식 인접 입지", body: "별 식당 3~5곳. 같은 구 안에서도 가격이 한 단계 높게 나타납니다." },
  { title: "클러스터 지구", body: "별 식당 6~9곳. 고급 숙박이 모이고 1박 가격이 뚜렷하게 높게 나타나는 구간입니다." },
  { title: "클러스터 핵심 입지", body: "별 식당 10곳 이상. 같은 조건 숙소 가운데 1박 가격이 가장 높게 나타나는 구간입니다." },
];

const HOST_TIER: Record<HostSize, string> = { "1": "1개", "2": "2~9개", "3": "10개 이상" };
export const HOST_LABEL: Record<HostSize, string> = { "1": "숙소 1개", "2": "2~9개", "3": "10개 이상" };

export type DiagnoseResult =
  | { ok: false }
  | {
      ok: true;
      district: Pick<District, "a" | "name" | "price" | "n">;
      nearby: NearbyRestaurant[];
      stars: { 3: number; 2: number; 1: number };
      bin: number;
      binLabel: Bin;
      score: number;
      tier: (typeof TIERS)[number];
      premium: PremiumRow;
      fair: number;
      /** 구간 프리미엄 95% 신뢰구간으로 낸 적정가 범위. 기준 구간(0곳)은 없음 */
      fairRange: [number, number] | null;
      gap: number | null; // 내 가격 ÷ 적정가 − 1
      binStats: AirbnbBinRow;
      baseStats: AirbnbBinRow;
      hostResid: ResidTierRow | undefined;
    };

export function diagnose(data: DiagnoseData, input: DiagnoseInput): DiagnoseResult {
  const district = districtAt(data, input.lng, input.lat);
  if (!district) return { ok: false };

  const nearby = nearbyRestaurants(data.restaurants, input.lng, input.lat);
  const stars = { 3: 0, 2: 0, 1: 0 } as { 3: number; 2: number; 1: number };
  for (const r of nearby) stars[r.stars as 1 | 2 | 3] += 1;

  const bin = binIndex(nearby.length);
  const premium = data.premium[bin];
  const fair = fairPrice(data, { district: district.name, room: input.room, acc: input.acc, bed: input.bed, bin });
  // 구간 효과만 신뢰구간 끝값으로 바꿔 계산: fair × (1+lo)/(1+pct) ~ fair × (1+hi)/(1+pct)
  const fairRange: [number, number] | null =
    bin === 0 ? null : [(fair * (1 + premium.lo)) / (1 + premium.pct), (fair * (1 + premium.hi)) / (1 + premium.pct)];

  return {
    ok: true,
    district,
    nearby,
    stars,
    bin,
    binLabel: data.bins[bin],
    score: locationScore(data.premium, bin),
    tier: TIERS[bin],
    premium,
    fair,
    fairRange,
    gap: input.price > 0 ? input.price / fair - 1 : null,
    binStats: data.airbnbBins[bin],
    baseStats: data.airbnbBins[0],
    hostResid: data.residTier.find((t) => t.tier === HOST_TIER[input.host]),
  };
}

const euro = (v: number) => `€${Math.round(v).toLocaleString("en-US")}`;

/** 결과 안내 문구(초안 기준, 인과 표현 피함) */
export function adviceFor(r: Extract<DiagnoseResult, { ok: true }>, input: DiagnoseInput): { title: string; body: string } {
  if (r.gap === null) return { title: "현재 1박 가격을 넣으면 적정가와 비교합니다", body: "" };
  const pct = Math.abs(Math.round(r.gap * 100));
  if (r.gap <= -0.1) {
    const host =
      input.host === "1" && r.hostResid && r.hostResid.resid_med < 0
        ? `숙소 1개 호스트는 클러스터 지구에서 같은 조건보다 평균 ${Math.abs(Math.round(r.hostResid.resid_med * 100))}% 낮게 받는 경향이 있습니다. 미식 입지를 가격에 반영할 여지가 있습니다.`
        : "미식 입지 프리미엄을 가격에 반영해 볼 만합니다.";
    return {
      title: `적정가보다 ${pct}% 낮게 받고 있습니다`,
      body: `같은 구, 같은 조건 숙소의 추정 가격은 ${euro(r.fair)}입니다. ${host}`,
    };
  }
  if (r.gap >= 0.15) {
    const occ = r.binStats.occ_med - r.baseStats.occ_med;
    return {
      title: `적정가보다 ${pct}% 높게 받고 있습니다`,
      body:
        occ > 0
          ? `가격이 높아도 예약이 유지되는지 확인하세요. 이 구간 숙소의 추정 예약일 중앙값은 별 식당 0곳 구간보다 ${Math.round(occ)}일 많습니다.`
          : "가격이 높아도 예약이 유지되는지 확인하세요. 이 위치에서는 미식 입지 프리미엄이 나타나지 않습니다.",
    };
  }
  return {
    title: "적정가 범위 안에 있습니다",
    body:
      r.bin >= 3
        ? "클러스터 지구는 비슷한 가격대 숙소가 많습니다. 가격보다 숙소 소개에 주변 미식 입지를 드러내는 쪽이 차별점이 됩니다."
        : "프리미엄이 작은 입지에서는 가격보다 예약률 관리가 먼저입니다.",
  };
}
