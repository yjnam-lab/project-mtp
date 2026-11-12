import type { Metadata } from "next";
import { ExploreApp } from "@/components/explore/explore-app";
import { container, PageHeader } from "@/components/page-header";
import { getRestaurants, getWebData } from "@/lib/data";
import { type ExploreData, sensitivity } from "@/lib/explore";

export const metadata: Metadata = {
  title: "동네 탐색",
  description: "파리 20개 구의 별 식당, 클러스터 숙소, 1박 가격과 추정 매출을 지도로 비교합니다.",
};

export default function ExplorePage() {
  const w = getWebData();
  const data: ExploreData = {
    dist: w.dist,
    polys: w.polys,
    restaurants: getRestaurants(),
    hotels: w.hotels,
    clusterCells: w.grid.filter((c) => c[3] > 0),
    sensitivity: sensitivity(w),
  };

  return (
    <main className="w-full flex-1">
      <PageHeader en="Explore" title="동네 탐색" current="/explore">
        파리 20개 구를 지표별로 비교하세요. 구를 누르면 별 식당, 클러스터 숙소 비중, 1박 가격과 추정 연매출을 한눈에 볼
        수 있습니다. 클러스터 숙소는 반경 500m 안에 별 식당이 6곳 이상인 숙소입니다.
      </PageHeader>

      <section className={`${container} py-12 md:py-16`}>
        <ExploreApp data={data} />
      </section>

      <footer className={`${container} border-t border-border py-10 text-sm leading-relaxed text-muted-foreground`}>
        <ul className="grid gap-1.5">
          <li>· 구 경계는 숙소 좌표로 추정한 것(불로뉴·뱅센 숲 제외)이며, 공식 경계로 교체할 예정입니다.</li>
          <li>· 수치는 데이터 정의서 v1.0 기준 재계산값입니다. 연매출·예약일은 Inside Airbnb 추정치입니다.</li>
          <li>· 별 식당과 숙박 가격은 함께 나타나는 관계이며, 식당이 가격을 올린다는 뜻은 아닙니다.</li>
          <li>· 호텔 층은 좌표가 있는 4~5성 숙박시설만 표시합니다.</li>
          <li>· 지도: OpenFreeMap © OpenMapTiles, © OpenStreetMap contributors. 별 식당: 미쉐린 가이드 2026.</li>
        </ul>
      </footer>
    </main>
  );
}
