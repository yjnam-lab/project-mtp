import type { Metadata } from "next";
import Link from "next/link";
import { type Column, ColumnChart } from "@/components/evidence/column-chart";
import { container, PageHeader } from "@/components/page-header";
import { getWebData } from "@/lib/data";
import { sensitivity } from "@/lib/explore";
import { formatCount, formatEuro, formatPct } from "@/lib/format";

export const metadata: Metadata = {
  title: "분석 근거",
  description: "파리 미쉐린 별 식당과 숙박의 공존, 호텔 등급, 1박 가격 프리미엄을 데이터로 보여 줍니다.",
};

const pctS = (v: number) => formatPct(v, { sign: true });

function SectionTitle({ no, title, children }: { no: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-brand tabular-nums">{no}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {children && <p className="mt-4 leading-relaxed text-muted-foreground">{children}</p>}
    </div>
  );
}

export default function EvidencePage() {
  const w = getWebData();
  const { inv, five, premium, airbnb_bins: ab, hotel_bins: hb, hotel_groups: hg, per_rest, rev_gap } = w;
  const top = premium[premium.length - 1];
  const sens = sensitivity(w);
  const grp = (name: string) => hg.find((g) => g.group === name);
  const g0 = grp("별 식당 0곳");
  const g1 = grp("1곳 이상");
  const g6 = grp("6곳 이상");
  const gAll = grp("파리 전체");
  const top4 = [...w.dist].sort((a, b) => b.rest - a.rest).slice(0, 4);
  const top4Share = top4.reduce((s, d) => s + d.rest, 0) / inv.restaurants;
  const revTop = w.dist.find((d) => d.name === rev_gap.top);
  const revBot = w.dist.find((d) => d.name === rev_gap.bot);

  const premiumCols: Column[] = premium.map((p, i) => ({
    label: p.bin,
    value: p.pct,
    lo: i ? p.lo : undefined,
    hi: i ? p.hi : undefined,
    highlight: i === premium.length - 1,
    tip: i
      ? [`${p.bin}: ${pctS(p.pct)}`, `95% 신뢰구간 ${pctS(p.lo)} ~ ${pctS(p.hi)}`, `숙소 ${formatCount(ab[i].n)}곳 · t = ${p.t}`]
      : [`${p.bin}: 비교 기준`, `숙소 ${formatCount(ab[i].n)}곳`],
  }));

  const hotelCols: Column[] = hb.map((b, i) => ({
    label: b.bin,
    value: b.hi,
    highlight: i === hb.length - 1,
    tip: [`${b.bin}: 4~5성 ${formatPct(b.hi)}`, `5성 ${formatPct(b.five)}`, `등급 숙박시설 ${formatCount(b.n)}곳`],
  }));

  const sensCols: Column[] = sens.map((s) => ({
    label: s.radius === 1000 ? "1km" : `${s.radius}m`,
    value: s.pct,
    highlight: s.radius === 500,
    tip: [
      `반경 ${s.radius === 1000 ? "1km" : `${s.radius}m`}: ${pctS(s.pct)}`,
      `별 식당 10곳 이상 숙소 ${formatCount(s.n)}곳`,
    ],
  }));

  const CLAIMS = [
    {
      q: "고급 숙박은 별 식당 가까이에 있을까?",
      a: `5성 호텔 ${five.n}곳 중 ${five.near}곳(${formatPct(five.share)})이 별 식당 반경 500m 안에 있습니다. 전체 등급 숙박시설은 ${formatPct(five.all_hotels_near)}입니다.`,
      big: formatPct(five.share),
    },
    {
      q: "별 식당이 많을수록 등급도 높을까?",
      a: `4~5성 비율이 별 식당 0곳 ${formatPct(g0?.hi ?? 0)} → 1곳 이상 ${formatPct(g1?.hi ?? 0)} → 6곳 이상 ${formatPct(g6?.hi ?? 0)}로 높아집니다.`,
      big: formatPct(g6?.hi ?? 0),
    },
    {
      q: "같은 동네 안에서도 가격이 다를까?",
      a: `같은 구, 같은 조건 숙소끼리 비교해도 별 식당 10곳 이상이면 1박 가격이 0곳보다 ${pctS(top.pct)} 높게 나타납니다. 1곳당 약 ${pctS(per_rest.pct)}입니다.`,
      big: pctS(top.pct),
    },
    {
      q: "별은 어디에 모여 있을까?",
      a: `별 식당의 ${formatPct(top4Share)}가 ${top4.map((d) => `${d.a}`).join("·")}구에 있습니다. 에어비앤비 추정 연매출 중앙값은 ${revTop?.a}구 ${formatEuro(rev_gap.top_v)}, ${revBot?.a}구 ${formatEuro(rev_gap.bot_v)}로 ${rev_gap.ratio.toFixed(2)}배 차이입니다.`,
      big: `${rev_gap.ratio.toFixed(2)}배`,
    },
  ];

  return (
    <main className="w-full flex-1">
      <PageHeader en="Evidence" title="분석 근거" current="/evidence">
        파리 에어비앤비 숙소 {formatCount(inv.listings)}곳, 등급 숙박시설 {formatCount(inv.hotels)}곳, 미쉐린 별 식당{" "}
        {inv.restaurants}곳을 반경 500m로 묶어 네 가지 질문을 확인했습니다. 모두 한 시점 자료로 본 함께 나타나는
        관계입니다.
      </PageHeader>

      {/* 질문과 결론 */}
      <section className={`${container} py-20 md:py-28`}>
        <SectionTitle no="01" title="질문과 결론" />
        <ol className="mt-10 grid border-t-2 border-foreground md:grid-cols-2">
          {CLAIMS.map((c, i) => (
            <li
              key={c.q}
              className={`border-b border-border py-10 md:px-10 ${i % 2 === 0 ? "md:pl-0" : "md:border-l md:pr-0"}`}
            >
              <p className="text-sm font-bold text-muted-foreground">
                <span className="mr-2 text-brand">Q{i + 1}</span>
                {c.q}
              </p>
              <p className="mt-4 text-6xl font-bold tracking-tight text-brand">{c.big}</p>
              <p className="mt-4 leading-relaxed">{c.a}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 가격 프리미엄 */}
      <section className="border-t border-border">
        <div className={`${container} grid grid-cols-[minmax(0,1fr)] gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16`}>
          <SectionTitle no="02" title="반경 500m 별 식당 수에 따른 1박 가격 프리미엄">
            같은 구 안에서 객실 유형·수용 인원·침실 수가 같은 숙소끼리 비교했을 때, 별 식당 0곳 숙소보다 1박 가격이
            얼마나 높게 나타나는지 보여 줍니다. 세로선은 95% 신뢰구간입니다. 식당 1곳당 효과는 {pctS(per_rest.pct)}(t ={" "}
            {per_rest.t})로 작지만, 6곳 이상 모인 클러스터에서 프리미엄이 뚜렷해집니다.
          </SectionTitle>
          <div>
            <p className="mb-4 text-sm font-bold">1박 가격 프리미엄 (0곳 대비)</p>
            <ColumnChart
              columns={premiumCols}
              max={0.6}
              ticks={[0, 0.2, 0.4, 0.6]}
              format="pct-signed"
              ariaLabel={`별 식당 수 구간별 1박 가격 프리미엄. ${premium.map((p) => `${p.bin} ${pctS(p.pct)}`).join(", ")}`}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              10곳 이상 {pctS(top.pct)}, 95% 신뢰구간 {pctS(top.lo)} ~ {pctS(top.hi)}
            </p>
          </div>
        </div>
      </section>

      {/* 호텔 등급 */}
      <section className="border-t border-border">
        <div className={`${container} grid grid-cols-[minmax(0,1fr)] gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16`}>
          <SectionTitle no="03" title="별 식당이 가까울수록 고급 숙박이 모입니다">
            Atout France 등급 숙박시설(좌표 있는 {formatCount(gAll?.n ?? inv.hotels_geo)}곳) 중 4~5성 비율입니다. 파리 전체는{" "}
            {formatPct(gAll?.hi ?? 0)}이지만, 반경 500m 별 식당 수가 늘수록 비율이 높아집니다.
          </SectionTitle>
          <div>
            <p className="mb-4 text-sm font-bold">4~5성 비율</p>
            <ColumnChart
              columns={hotelCols}
              max={1}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              format="pct"
              ariaLabel={`별 식당 수 구간별 4~5성 비율. ${hb.map((b) => `${b.bin} ${formatPct(b.hi)}`).join(", ")}`}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              10곳 이상 구간은 시설 {hb[hb.length - 1].n}곳으로 표본이 작습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 반경 민감도 */}
      <section className="border-t border-border">
        <div className={`${container} grid grid-cols-[minmax(0,1fr)] gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16`}>
          <SectionTitle no="04" title="반경을 바꿔도 결론은 같습니다">
            반경 안 별 식당 10곳 이상 숙소의 프리미엄을 반경별로 다시 계산했습니다. 300m로 좁히면 해당 숙소가{" "}
            {formatCount(sens[0].n)}곳으로 줄지만 프리미엄은 비슷하고, 1km로 넓히면 대상이 {formatCount(sens[2].n)}곳으로
            늘면서 프리미엄이 묽어집니다. 서비스는 500m를 기준으로 씁니다.
          </SectionTitle>
          <div>
            <p className="mb-4 text-sm font-bold">별 식당 10곳 이상 숙소의 1박 가격 프리미엄</p>
            <ColumnChart
              columns={sensCols}
              max={0.6}
              ticks={[0, 0.2, 0.4, 0.6]}
              format="pct-signed"
              height={260}
              ariaLabel={`반경별 프리미엄. ${sensCols.map((c) => `${c.label} ${pctS(c.value)}`).join(", ")}`}
            />
          </div>
        </div>
      </section>

      {/* 표 */}
      <section className="border-t border-border">
        <div className={`${container} py-20 md:py-28`}>
          <SectionTitle no="05" title="구간별 숫자">
            위 차트의 값을 포함한 에어비앤비 숙소 구간별 요약입니다.
          </SectionTitle>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[760px] border-t-2 border-foreground text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  {["반경 500m 별 식당", "숙소", "프리미엄", "95% 신뢰구간", "1박 중앙값", "예약일 중앙값", "연매출 중앙값", "전문 호스트", "4~5성 비율"].map(
                    (h, i) => (
                      <th key={h} className={`py-3 font-bold ${i ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {ab.map((b, i) => (
                  <tr key={b.bin} className={`border-b border-border ${i === ab.length - 1 ? "font-bold" : ""}`}>
                    <td className="py-3">{b.bin}</td>
                    <td className="text-right">{formatCount(b.n)}</td>
                    <td className="text-right">{i ? pctS(premium[i].pct) : "기준"}</td>
                    <td className="text-right">{i ? `${pctS(premium[i].lo)} ~ ${pctS(premium[i].hi)}` : "–"}</td>
                    <td className="text-right">{formatEuro(b.price_med)}</td>
                    <td className="text-right">{Math.round(b.occ_med)}일</td>
                    <td className="text-right">{formatEuro(b.rev_med)}</td>
                    <td className="text-right">{formatPct(b.pro)}</td>
                    <td className="text-right">{formatPct(hb[i].hi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 방법과 한계 */}
      <section className="border-t border-border bg-muted">
        <div className={`${container} grid gap-12 py-20 md:grid-cols-2 md:py-28`}>
          <div>
            <SectionTitle no="06" title="방법과 한계" />
            <ul className="mt-8 grid gap-4 leading-relaxed">
              <li>
                <b>가격 모델</b> · 로그 1박 가격을 별 식당 구간, 객실 유형, 수용 인원, 침실 수로 설명하는 회귀입니다. 구
                고정효과로 같은 구 안에서 비교하고, 표준오차는 구 단위로 묶었습니다. 가격 상위 0.5%는 제외했습니다.
              </li>
              <li>
                <b>인과가 아닙니다</b> · 한 시점 자료이므로 별 식당이 가격을 올린다는 뜻이 아니라, 별 식당이 많은 곳에서
                높은 가격이 함께 나타난다는 뜻입니다.
              </li>
              <li>
                <b>평점으로는 보이지 않는 차이</b> · 위치 평점은 {formatPct(w.loc48, { digits: 0 })}가 4.8점 이상이라 평점만으로는
                동네 간 차이가 드러나지 않습니다.
              </li>
              <li>
                <b>적정가는 추정치</b> · 진단 화면의 적정가는 위 회귀식의 예측값을 보여 주는 데모입니다.
              </li>
            </ul>
          </div>
          <div>
            <SectionTitle no="07" title="데이터 출처와 정의" />
            <dl className="mt-8 grid gap-4 leading-relaxed">
              <div>
                <dt className="font-bold">Inside Airbnb · 파리 listings</dt>
                <dd className="text-muted-foreground">숙소 {formatCount(inv.listings)}곳. 예약일·연매출은 Inside Airbnb 추정치</dd>
              </div>
              <div>
                <dt className="font-bold">Atout France · 등급 숙박시설</dt>
                <dd className="text-muted-foreground">
                  {formatCount(inv.hotels)}곳(좌표 있는 곳 {formatCount(inv.hotels_geo)}곳)
                </dd>
              </div>
              <div>
                <dt className="font-bold">미쉐린 가이드 2026 · 별 식당</dt>
                <dd className="text-muted-foreground">
                  {inv.restaurants}곳(3★ {inv.r3} · 2★ {inv.r2} · 1★ {inv.r1})
                </dd>
              </div>
              <div>
                <dt className="font-bold">정의</dt>
                <dd className="text-muted-foreground">
                  반경은 숙소 좌표에서 직선거리 500m. 클러스터 숙소는 반경 안 별 식당 6곳 이상(
                  {formatCount(inv.cluster_listings)}곳). 수치는 데이터 정의서 v1.0 기준 재계산값
                </dd>
              </div>
              <div>
                <dt className="font-bold">구 경계</dt>
                <dd className="text-muted-foreground">
                  숙소 좌표로 추정한 경계(불로뉴·뱅센 숲 제외). 공식 경계를 확보하면 교체할 예정
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 마무리 */}
      <section className="bg-foreground text-background">
        <div className={`${container} flex flex-col gap-8 py-20 md:flex-row md:items-end md:justify-between md:py-28`}>
          <h2 className="text-5xl font-bold tracking-tight md:text-7xl">On y va&nbsp;?</h2>
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center bg-brand px-8 py-4 text-lg font-bold text-brand-foreground hover:bg-background hover:text-foreground"
          >
            내 숙소 진단하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
