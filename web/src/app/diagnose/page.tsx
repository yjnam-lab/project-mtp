import type { Metadata } from "next";
import Link from "next/link";
import { DiagnoseApp } from "@/components/diagnose/diagnose-app";
import { getRestaurants, getWebData } from "@/lib/data";
import type { DiagnoseData } from "@/lib/diagnose";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "내 숙소 진단 — Paris Étoile",
  description: "숙소 위치를 고르면 반경 500m 미쉐린 별 식당으로 미식 입지 점수와 적정가(추정치)를 보여 줍니다.",
};

const container = "mx-auto w-full max-w-[1440px] px-5 md:px-[76px]";

export default function DiagnosePage() {
  const w = getWebData();
  // 클라이언트로 넘길 부분만 추림
  const data: DiagnoseData = {
    restaurants: getRestaurants(),
    polys: w.polys,
    dist: w.dist.map(({ a, name, price, n }) => ({ a, name, price, n })),
    coef: w.coef,
    bins: w.bins,
    premium: w.premium,
    airbnbBins: w.airbnb_bins,
    residTier: w.resid_tier,
  };

  return (
    <main className="w-full flex-1">
      <header className="bg-foreground text-background">
        <div className={`${container} py-6`}>
          <Link href="/" className="text-sm font-bold hover:text-brand">
            ← Paris Étoile
          </Link>
        </div>
        <div className={`${container} pt-10 pb-16 md:pt-16 md:pb-24`}>
          <p className="text-5xl font-extralight tracking-tight md:text-7xl">Diagnose</p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">내 숙소 진단</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-background/70">
            지도에서 숙소 위치를 고르고 조건과 현재 1박 가격을 넣으세요. 반경 500m 안 별 식당으로 미식 입지 점수와
            같은 조건 숙소의 적정가(추정치)를 보여 드립니다.
          </p>
        </div>
      </header>

      <section className={`${container} py-12 md:py-16`}>
        <DiagnoseApp data={data} />
      </section>

      <footer className={`${container} border-t border-border py-10 text-sm leading-relaxed text-muted-foreground`}>
        <ul className="grid gap-1.5">
          <li>
            · 적정가는 Inside Airbnb 파리 숙소 {formatCount(w.inv.listings)}곳으로 학습한 로그 가격 회귀(구·객실 유형·수용
            인원·침실 수·별 식당 구간)의 추정치입니다. 실제 수익을 보장하지 않습니다.
          </li>
          <li>· 별 식당과 숙박 가격은 함께 나타나는 관계이며, 식당이 가격을 올린다는 뜻은 아닙니다.</li>
          <li>· 미식 입지 점수는 팀 합의 전 임시 정의입니다(구간 프리미엄 ÷ 최고 구간 프리미엄 × 100).</li>
          <li>· 구 경계는 숙소 좌표로 추정한 것(불로뉴·뱅센 숲 제외)이며, 공식 경계로 교체할 예정입니다.</li>
          <li>· 지도: OpenFreeMap © OpenMapTiles, © OpenStreetMap contributors. 별 식당: 미쉐린 가이드 2026.</li>
        </ul>
      </footer>
    </main>
  );
}
