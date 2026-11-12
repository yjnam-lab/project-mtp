import Link from "next/link";
import { IntroHero } from "@/components/intro-hero";
import { findDistrictByName, getPremium, getWebData } from "@/lib/data";
import { formatCount, formatEuro, formatPct } from "@/lib/format";

// 핵심 수치: web.json(데이터 정의서 v1.0 기준 재계산값)에서 읽는다
const { inv, five, rev_gap } = getWebData();
const top10 = getPremium("10곳 이상");
const revTop = findDistrictByName(rev_gap.top);
const revBot = findDistrictByName(rev_gap.bot);

const FACTS = [
  {
    label: "가격 프리미엄",
    value: top10 ? formatPct(top10.pct, { sign: true }) : "-",
    note: "반경 500m 별 식당 10곳 이상 숙소의 1박 가격, 0곳 대비 (같은 구 안 비교)",
  },
  {
    label: "5성 호텔의 선택",
    value: formatPct(five.share),
    note: `파리 5성 호텔 ${five.n}곳 중 ${five.near}곳이 별 식당 반경 500m 안에 있습니다`,
  },
  {
    label: "동네별 수익 격차",
    value: `${rev_gap.ratio.toFixed(2)}배`,
    note: `에어비앤비 추정 연매출 중앙값, ${revTop?.a ?? ""}구 ${formatEuro(rev_gap.top_v)} vs ${revBot?.a ?? ""}구 ${formatEuro(rev_gap.bot_v)}`,
  },
];

const STEPS = [
  { title: "위치를 넣습니다", body: "주소를 입력하거나 지도에서 숙소 위치를 고릅니다." },
  { title: "미식 입지를 봅니다", body: "반경 500m 안 미쉐린 별 식당의 수와 등급으로 입지 점수를 계산합니다." },
  { title: "적정가와 비교합니다", body: "같은 구, 같은 조건 숙소의 가격과 비교해 내 가격이 제값인지 확인합니다." },
];

const container = "mx-auto w-full max-w-[1440px] px-5 md:px-[76px]";

export default function Home() {
  return (
    <main className="w-full flex-1">
      <IntroHero />

      {/* 소개 */}
      <section className={`${container} grid gap-10 py-24 md:grid-cols-2 md:gap-14 md:py-32`}>
        <p className="text-5xl font-extralight leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
          Where
          <br />
          stars set
          <br />
          the price
        </p>
        <div>
          <h2 className="text-2xl font-bold leading-snug tracking-tight md:text-3xl">
            역세권 말고 별세권.
            <br />
            내 숙소의 숨은 프리미엄을 제값으로.
          </h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            파리 에어비앤비 숙소 {formatCount(inv.listings)}곳, 등급 숙박시설 {formatCount(inv.hotels)}곳, 미쉐린
            별 식당 {formatCount(inv.restaurants)}곳을 반경 500m로 묶어
            분석했습니다. 별 식당이 가까울수록 고급 숙박이 모이고, 같은 동네 안에서도 1박 가격이 단계적으로
            올라갑니다.
          </p>
          <Link
            href="/evidence"
            className="mt-8 inline-block border-b-2 border-foreground pb-1 font-bold hover:border-brand hover:text-brand"
          >
            분석 근거 보기 ↗
          </Link>
        </div>
      </section>

      {/* 핵심 숫자 */}
      <section className="border-y border-border">
        <div className={`${container} grid md:grid-cols-3`}>
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={`py-12 ${i === 0 ? "md:pr-10" : "border-t border-border md:border-t-0 md:border-l md:px-10"}`}
            >
              <p className="text-sm font-bold text-muted-foreground">{f.label}</p>
              <p className="mt-3 text-6xl font-bold tracking-tight text-brand tabular-nums">{f.value}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 진단 흐름 */}
      <section className={`${container} py-24 md:py-32`}>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">이렇게 진단합니다</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-foreground pt-6">
              <p className="text-sm font-bold text-brand tabular-nums">0{i + 1}</p>
              <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 마무리 */}
      <section className="bg-foreground text-background">
        <div
          className={`${container} flex flex-col gap-8 py-24 md:flex-row md:items-end md:justify-between md:py-32`}
        >
          <div>
            <h2 className="text-6xl font-bold tracking-tight md:text-8xl">On y va&nbsp;?</h2>
            <p className="mt-4 text-lg text-background/70">내 숙소 위치를 넣고 미식 입지 점수를 확인하세요.</p>
          </div>
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center bg-brand px-8 py-4 text-lg font-bold text-brand-foreground hover:bg-background hover:text-foreground"
          >
            내 숙소 진단하기 →
          </Link>
        </div>
      </section>

      <footer className={`${container} py-10 text-sm leading-relaxed text-muted-foreground`}>
        데이터: Inside Airbnb(파리), 미쉐린 가이드 2026, Atout France 숙박시설 등급
        <br />
        인트로 이미지: AI 생성
        <br />
        KAIST 정보경영프로그램 15기 · IT 기반 비즈니스 혁신 1조
      </footer>
    </main>
  );
}