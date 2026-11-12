// 진단 결과 패널(표시만 담당)
import { adviceFor, type DiagnoseInput, type DiagnoseResult, HOST_LABEL } from "@/lib/diagnose";
import { formatCount, formatEuro, formatPct } from "@/lib/format";

const signed = (v: number, digits = 0) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(digits)}%`;

export function DiagnoseResultPanel({ result, input }: { result: DiagnoseResult; input: DiagnoseInput }) {
  if (!result.ok) {
    return (
      <div className="border-t-2 border-foreground pt-8">
        <p className="text-2xl font-bold">선택한 위치가 구 경계 밖입니다</p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          파리 시내(불로뉴·뱅센 숲 제외)를 선택해 주세요. 구 경계는 숙소 좌표로 추정한 것입니다.
        </p>
      </div>
    );
  }

  const r = result;
  const advice = adviceFor(r, input);
  const hot = r.gap !== null && Math.abs(r.gap) >= 0.1;

  return (
    <div>
      {/* 위치와 점수 */}
      <div className="border-t-2 border-foreground pt-6">
        <p className="text-sm font-bold text-muted-foreground">
          {r.district.a}구 · {r.district.name}
          <span className="ml-2 font-mono font-normal">
            {input.lat.toFixed(4)}, {input.lng.toFixed(4)}
          </span>
        </p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-8xl leading-none font-bold tracking-tight tabular-nums">{r.score}</p>
          <p className="pb-2 text-xl font-bold text-muted-foreground">/100</p>
          <span className="mb-3 ml-auto border border-border px-2 py-0.5 text-xs text-muted-foreground">임시 점수</span>
        </div>
        <div className="mt-5 h-1 w-full bg-border" aria-hidden>
          <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${r.score}%` }} />
        </div>
        <p className="mt-5 text-xl font-bold">{r.tier.title}</p>
        <p className="mt-2 leading-relaxed text-muted-foreground">{r.tier.body}</p>
      </div>

      {/* 반경 500m 별 식당 */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-border pt-6">
        <p className="text-lg font-bold">
          반경 500m 별 식당 <span className="text-brand tabular-nums">{r.nearby.length}곳</span>
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          3★ {r.stars[3]} · 2★ {r.stars[2]} · 1★ {r.stars[1]}
        </p>
      </div>

      {/* 핵심 숫자 */}
      <div className="mt-6 grid border-y border-border sm:grid-cols-3">
        <div className="py-6 sm:pr-5">
          <p className="text-sm font-bold text-muted-foreground">적정가 (추정치)</p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatEuro(r.fair)}</p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {r.fairRange ? `${formatEuro(r.fairRange[0])} ~ ${formatEuro(r.fairRange[1])}` : "기준 구간이라 범위 없음"}
          </p>
        </div>
        <div className="border-t border-border py-6 sm:border-t-0 sm:border-l sm:px-5">
          <p className="text-sm font-bold text-muted-foreground">내 가격과의 차이</p>
          <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${hot ? "text-brand" : ""}`}>
            {r.gap === null ? "–" : signed(r.gap)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {input.price > 0 ? `현재 ${formatEuro(input.price)}` : "가격 미입력"}
          </p>
        </div>
        <div className="border-t border-border py-6 sm:border-t-0 sm:border-l sm:pl-5">
          <p className="text-sm font-bold text-muted-foreground">미식 입지 프리미엄</p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">
            {formatPct(r.premium.pct, { sign: true })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{r.binLabel} 구간, 0곳 대비</p>
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-8 border-l-2 border-brand pl-5">
        <p className="font-bold">{advice.title}</p>
        {advice.body && <p className="mt-2 leading-relaxed text-muted-foreground">{advice.body}</p>}
      </div>

      {/* 근거 숫자 */}
      <h3 className="mt-12 text-lg font-bold">근거 숫자</h3>
      <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
        {[
          [
            "이 구간 프리미엄 95% 신뢰구간",
            r.bin === 0 ? "비교 기준 구간" : `${formatPct(r.premium.lo, { sign: true })} ~ ${formatPct(r.premium.hi, { sign: true })}`,
          ],
          [
            `같은 구간(${r.binLabel}) 숙소`,
            `${formatCount(r.binStats.n)}곳 · 1박 중앙값 ${formatEuro(r.binStats.price_med)}`,
          ],
          ["별 식당 0곳 구간 숙소", `${formatCount(r.baseStats.n)}곳 · 1박 중앙값 ${formatEuro(r.baseStats.price_med)}`],
          [`${r.district.a}구 숙소`, `${formatCount(r.district.n)}곳 · 1박 중앙값 ${formatEuro(r.district.price)}`],
          [
            `호스트 규모 참고값(${HOST_LABEL[input.host]})`,
            r.hostResid ? `클러스터 지구 가격 잔차 중앙값 ${signed(r.hostResid.resid_med, 1)}` : "–",
          ],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {/* 주변 별 식당 */}
      <h3 className="mt-12 text-lg font-bold">주변 별 식당</h3>
      {r.nearby.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">반경 500m 안에 별 식당이 없습니다.</p>
      ) : (
        <ol className="mt-4 divide-y divide-border border-y border-border">
          {r.nearby.map((x) => (
            <li key={x.name} className="flex items-baseline gap-4 py-3">
              <span className="w-10 shrink-0 text-sm font-bold text-brand">{"★".repeat(x.stars)}</span>
              <span className="min-w-0 flex-1">
                <span className="font-bold">{x.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">{x.cuisine}</span>
              </span>
              <span className="shrink-0 font-mono text-sm text-muted-foreground">{Math.round(x.distance)}m</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
