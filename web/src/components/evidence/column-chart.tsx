"use client";

// 세로 막대 차트(단일 계열). 강조 막대만 레드, 나머지는 회색. 선택적으로 95% 신뢰구간 표시
// 규칙: 막대 최대 24px, 가는 격자, 값은 막대 끝, 막대 띠 전체가 hover 영역, 키보드 포커스 지원
import { useEffect, useRef, useState } from "react";

export type Column = {
  label: string;
  value: number;
  lo?: number;
  hi?: number;
  highlight?: boolean;
  /** 툴팁 줄(첫 줄은 굵게) */
  tip: string[];
};

const BRAND = "#d0102b";
const GREY = "#b8b8b8";
const INK = "#111111";
const GRID = "#e5e5e5";
const MUTED = "#6b6b6b";

export function ColumnChart({
  columns,
  max,
  ticks,
  format,
  height = 300,
  ariaLabel,
}: {
  columns: Column[];
  max: number;
  ticks: number[];
  /** pct: 0.42 → 42%, pct-signed: 0.42 → +42% (서버에서 넘기므로 함수 대신 이름) */
  format: "pct" | "pct-signed";
  height?: number;
  ariaLabel: string;
}) {
  const fmt = (v: number) => `${format === "pct-signed" && v > 0 ? "+" : ""}${Math.round(v * 1000) / 10}%`;
  const boxRef = useRef<HTMLDivElement>(null);
  // 폭을 재기 전(서버 렌더·첫 화면)에는 640 기준으로 그린 뒤 칸에 맞춰 축소해서 보여 줌
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? 640;
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMeasured(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = { top: 28, right: 8, bottom: 36, left: 44 };
  const w = width - m.left - m.right;
  const h = height - m.top - m.bottom;
  const band = w / columns.length;
  const barW = Math.min(24, band * 0.5);
  const y = (v: number) => m.top + h - (Math.max(0, Math.min(v, max)) / max) * h;
  const cx = (i: number) => m.left + band * i + band / 2;

  return (
    <div ref={boxRef} className="relative w-full min-w-0 overflow-hidden">
      <svg
        width={measured ?? "100%"}
        height={measured ? height : undefined}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="block max-w-full"
      >
        {/* 격자와 눈금 */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? INK : GRID} strokeWidth={1} />
            <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill={MUTED} className="tabular-nums">
              {fmt(t)}
            </text>
          </g>
        ))}

        {columns.map((c, i) => {
          const on = hover === i;
          const top = y(c.value);
          const hasCi = c.lo !== undefined && c.hi !== undefined && c.hi > c.lo;
          const labelY = (hasCi ? y(c.hi!) : top) - 8;
          return (
            <g
              key={c.label}
              tabIndex={0}
              role="img"
              aria-label={c.tip.join(", ")}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              {/* hover 영역: 막대 띠 전체 */}
              <rect x={m.left + band * i} y={m.top} width={band} height={h} fill={on ? "#f4f4f4" : "transparent"} />
              <rect
                x={cx(i) - barW / 2}
                y={top}
                width={barW}
                height={Math.max(0, m.top + h - top)}
                fill={c.highlight ? BRAND : on ? "#8c8c8c" : GREY}
              />
              {hasCi && (
                <g stroke={INK} strokeWidth={1.5}>
                  <line x1={cx(i)} x2={cx(i)} y1={y(c.lo!)} y2={y(c.hi!)} />
                  <line x1={cx(i) - 5} x2={cx(i) + 5} y1={y(c.lo!)} y2={y(c.lo!)} />
                  <line x1={cx(i) - 5} x2={cx(i) + 5} y1={y(c.hi!)} y2={y(c.hi!)} />
                </g>
              )}
              <text x={cx(i)} y={labelY} textAnchor="middle" fontSize={13} fontWeight={700} fill={INK}>
                {fmt(c.value)}
              </text>
              <text x={cx(i)} y={m.top + h + 22} textAnchor="middle" fontSize={12} fill={MUTED}>
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[240px] border border-foreground bg-background px-3 py-2 text-xs leading-relaxed shadow-sm"
          style={{
            left: Math.min(Math.max(cx(hover) - 60, 0), width - 200),
            top: Math.max(0, y(columns[hover].hi ?? columns[hover].value) - 90),
          }}
        >
          {columns[hover].tip.map((t, k) => (
            <p key={k} className={k === 0 ? "font-bold" : "text-muted-foreground"}>
              {t}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
