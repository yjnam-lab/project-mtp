"use client";

// 탐색 화면: 필터 상태를 들고 지도·구 요약·순위 막대에 넘김
import Link from "next/link";
import { useMemo, useState } from "react";
import { districtCenter } from "@/lib/diagnose";
import {
  countByDistrict,
  type ExploreData,
  GREY_RAMP,
  level,
  METRIC_KEYS,
  METRICS,
  type MetricKey,
  metricValue,
  type RadiusM,
  type Stars,
} from "@/lib/explore";
import { formatCount, formatEuro, formatPct } from "@/lib/format";
import { ExploreMap, type Layers } from "./explore-map";

const RADII: RadiusM[] = [300, 500, 1000];
const radiusLabel = (r: RadiusM) => (r === 1000 ? "1km" : `${r}m`);

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`border px-3 py-1.5 text-sm font-bold transition-colors ${
        on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <p className="w-16 shrink-0 text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ExploreApp({ data }: { data: ExploreData }) {
  const [metric, setMetric] = useState<MetricKey>("rest");
  const [stars, setStars] = useState<Stars[]>([3, 2, 1]);
  const [radius, setRadius] = useState<RadiusM>(500);
  const [layers, setLayers] = useState<Layers>({ rest: true, rings: true, cluster: false, hotel: false });
  const [selected, setSelected] = useState(8);

  const M = METRICS[metric];
  const restCount = useMemo(() => countByDistrict(data.restaurants, stars), [data.restaurants, stars]);
  const restaurants = useMemo(
    () => data.restaurants.filter((r) => stars.includes(r.stars as Stars)),
    [data.restaurants, stars],
  );
  const values = useMemo(
    () => Object.fromEntries(data.dist.map((d) => [d.a, metricValue(d, metric, restCount)])) as Record<number, number>,
    [data.dist, metric, restCount],
  );
  const districts = useMemo(
    () =>
      Object.fromEntries(
        data.dist.map((d) => [d.a, { level: level(values[d.a], M.steps), tip: `${d.a}구 ${d.name} · ${M.label} ${M.fmt(values[d.a])}` }]),
      ),
    [data.dist, values, M],
  );
  const ranking = useMemo(() => [...data.dist].sort((a, b) => values[b.a] - values[a.a]), [data.dist, values]);
  const maxValue = Math.max(...Object.values(values), 1);

  const d = data.dist.find((x) => x.a === selected)!;
  const center = districtCenter(data.polys, selected);
  const sens = data.sensitivity.find((s) => s.radius === radius)!;
  const toggleStar = (s: Stars) =>
    setStars((cur) => (cur.includes(s) ? (cur.length > 1 ? cur.filter((x) => x !== s) : cur) : [...cur, s]));
  const starLabel = stars.length === 3 ? "" : ` (${[...stars].sort((a, b) => b - a).map((s) => `${s}★`).join("·")})`;

  return (
    <>
      {/* 필터 */}
      <div className="grid gap-4 border-y border-border py-6">
        <FilterRow label="지표">
          {METRIC_KEYS.map((k) => (
            <Chip key={k} on={metric === k} onClick={() => setMetric(k)}>
              {METRICS[k].label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="별 등급">
          {([3, 2, 1] as Stars[]).map((s) => (
            <Chip key={s} on={stars.includes(s)} onClick={() => toggleStar(s)}>
              {"★".repeat(s)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="반경">
          {RADII.map((r) => (
            <Chip key={r} on={radius === r} onClick={() => setRadius(r)}>
              {radiusLabel(r)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="겹쳐 보기">
          {(
            [
              ["rest", "별 식당"],
              ["rings", "별 식당 반경"],
              ["cluster", "클러스터 숙소"],
              ["hotel", "4~5성 호텔"],
            ] as [keyof Layers, string][]
          ).map(([k, label]) => (
            <Chip key={k} on={layers[k]} onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}>
              {label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <div className="mt-10 grid gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        {/* 지도 */}
        <div>
          <div className="border border-border">
            <ExploreMap
              polys={data.polys}
              districts={districts}
              selected={selected}
              onSelect={setSelected}
              restaurants={restaurants}
              hotels={data.hotels}
              clusterCells={data.clusterCells}
              radius={radius}
              layers={layers}
            />
          </div>
          {/* 범례 */}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {GREY_RAMP.map((c, i) => (
                <span key={c} className="flex flex-col items-start">
                  <i className="block h-3 w-10" style={{ background: c }} />
                  <span className="mt-1 tabular-nums">{M.fmt(M.steps[i])}</span>
                </span>
              ))}
              <span className="ml-2 self-start">{M.label}{metric === "rest" ? starLabel : ""} · 구 단위</span>
            </div>
            <span className="flex items-center gap-1.5">
              <i className="block size-2.5 rounded-full bg-brand" /> 별 식당
            </span>
            <span className="flex items-center gap-1.5">
              <i className="block size-2.5 border border-brand/50 bg-brand/10" /> 반경 {radiusLabel(radius)}
            </span>
          </div>
          {/* 반경 민감도 */}
          <div className="mt-8 border-l-2 border-brand pl-5">
            <p className="font-bold">
              반경 {radiusLabel(radius)} 안 별 식당 10곳 이상 숙소: 1박 가격 {formatPct(sens.pct, { sign: true })}{" "}
              <span className="font-normal text-muted-foreground">({formatCount(sens.n)}곳, 0곳 대비)</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.sensitivity
                .map((s) => `${radiusLabel(s.radius)} ${formatPct(s.pct, { sign: true })}`)
                .join(" · ")}
              . 반경을 넓힐수록 프리미엄이 묽어집니다. 구별 수치와 클러스터 숙소는 500m 기준입니다.
            </p>
          </div>
        </div>

        {/* 구 요약 */}
        <aside aria-live="polite">
          <div className="border-t-2 border-foreground pt-6">
            <p className="text-7xl leading-none font-bold tracking-tight tabular-nums">
              {d.a}
              <span className="ml-1 align-top text-2xl font-extralight">{d.a === 1 ? "er" : "e"} arr.</span>
            </p>
            <p className="mt-4 text-xl font-bold">{d.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              숙소 {formatCount(d.n)}곳 · 등급 숙박시설 {formatCount(d.hotels)}곳
            </p>
          </div>
          <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
            {(
              [
                [`별 식당${starLabel}`, `${restCount[d.a] ?? 0}곳${d.rest ? ` (전체 3★ ${d.r3} · 2★ ${d.r2})` : ""}`, (restCount[d.a] ?? 0) >= 10],
                ["클러스터 숙소 비중", formatPct(d.cl), d.cl >= 0.2],
                ["1박 가격 중앙값", formatEuro(d.price), false],
                ["추정 연매출 중앙값", formatEuro(d.rev), false],
                ["추정 예약일 중앙값", `${Math.round(d.occ)}일`, false],
                ["전문 호스트 비중", formatPct(d.pro), false],
                ["4~5성 호텔 비율", formatPct(d.hi), false],
                ["위치 평점 평균", d.loc.toFixed(2), false],
              ] as [string, string, boolean][]
            ).map(([k, v, hot]) => (
              <div key={k} className="flex justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className={`font-bold tabular-nums ${hot ? "text-brand" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-10 text-lg font-bold">대표 별 식당</h3>
          {d.top.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">별 식당이 없는 구입니다. 미식 입지 프리미엄을 기대하기 어렵습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {d.top.map(([name, s]) => (
                <li key={name} className="flex items-baseline gap-4 py-3">
                  <span className="w-10 shrink-0 text-sm font-bold text-brand">{"★".repeat(s)}</span>
                  <span className="font-bold">{name}</span>
                </li>
              ))}
            </ul>
          )}

          {center && (
            <Link
              href={`/diagnose?lng=${center[0].toFixed(5)}&lat=${center[1].toFixed(5)}`}
              className="mt-10 inline-block border-b-2 border-foreground pb-1 font-bold hover:border-brand hover:text-brand"
            >
              이 동네에서 진단하기 →
            </Link>
          )}
        </aside>
      </div>

      {/* 20개 구 순위 */}
      <section className="mt-24">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {M.label}
          {metric === "rest" ? starLabel : ""} 순위
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">막대를 누르면 위 지도와 구 요약이 바뀝니다.</p>
        <ol className="mt-8 grid gap-1.5">
          {ranking.map((x, i) => {
            const on = x.a === selected;
            return (
              <li key={x.a}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(x.a);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-pressed={on}
                  className="group grid w-full grid-cols-[2rem_9rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-left text-sm sm:grid-cols-[2rem_12rem_minmax(0,1fr)_6rem]"
                >
                  <span className="font-mono text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className={`truncate font-bold ${on ? "text-brand" : ""}`}>
                    {x.a}구 <span className="font-normal text-muted-foreground">{x.name}</span>
                  </span>
                  <span className="h-5 bg-muted">
                    <span
                      className={`block h-full transition-[width] duration-500 ${on ? "bg-brand" : "bg-[#b8b8b8] group-hover:bg-[#8c8c8c]"}`}
                      style={{ width: `${(values[x.a] / maxValue) * 100}%` }}
                    />
                  </span>
                  <span className={`text-right font-bold tabular-nums ${on ? "text-brand" : ""}`}>{M.fmt(values[x.a])}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
