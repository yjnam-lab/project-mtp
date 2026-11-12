import type { Metadata } from "next";
import { Suspense } from "react";
import { container, PageHeader } from "@/components/page-header";
import { DiagnoseApp, DiagnoseFromUrl } from "@/components/diagnose/diagnose-app";
import { getRestaurants, getWebData } from "@/lib/data";
import type { DiagnoseData } from "@/lib/diagnose";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "내 숙소 진단",
  description: "숙소 위치를 고르면 반경 500m 미쉐린 별 식당으로 미식 입지 점수와 적정가(추정치)를 보여 줍니다.",
};

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
      <PageHeader en="Diagnose" title="내 숙소 진단" current="/diagnose">
        지도에서 숙소 위치를 고르고 조건과 현재 1박 가격을 넣으세요. 반경 500m 안 별 식당으로 미식 입지 점수와 같은
        조건 숙소의 적정가(추정치)를 보여 드립니다.
      </PageHeader>

      <section className={`${container} py-12 md:py-16`}>
        {/* 주소창 좌표를 읽는 부분만 요청 시점에 그리고, 그 전에는 기본 위치 화면을 보여 줌 */}
        <Suspense fallback={<DiagnoseApp data={data} />}>
          <DiagnoseFromUrl data={data} />
        </Suspense>
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
