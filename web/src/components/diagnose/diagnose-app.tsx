"use client";

// 진단 화면: 입력 상태를 들고 지도·결과에 넘김
import { useMemo, useState } from "react";
import {
  diagnose,
  type DiagnoseData,
  type DiagnoseInput,
  districtAt,
  districtCenter,
  HOST_LABEL,
  type HostSize,
  type RoomType,
} from "@/lib/diagnose";
import { DiagnoseMap } from "./diagnose-map";
import { DiagnoseResultPanel } from "./diagnose-result";

const DEFAULT: DiagnoseInput = {
  lng: 2.31, // 8구 샹젤리제 부근
  lat: 48.869,
  room: "Entire home/apt",
  acc: 4,
  bed: 1,
  price: 260,
  host: "1",
};

const ROOMS: [RoomType, string][] = [
  ["Entire home/apt", "집 전체"],
  ["Private room", "개인실"],
  ["Hotel room", "호텔 객실"],
];
const HOSTS = Object.entries(HOST_LABEL) as [HostSize, string][];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{label}</legend>
      <div className="mt-2 grid grid-cols-3 border border-foreground">
        {options.map(([v, text], i) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`py-2.5 text-sm font-bold transition-colors ${i > 0 ? "border-l border-foreground" : ""} ${
              value === v ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Range({
  id,
  label,
  unit,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-sm font-bold">
        {label}
        <output htmlFor={id} className="tabular-nums">
          {value}
          {unit}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-foreground"
      />
    </div>
  );
}

export function DiagnoseApp({ data }: { data: DiagnoseData }) {
  const [input, setInput] = useState<DiagnoseInput>(DEFAULT);
  const [flyToken, setFlyToken] = useState(0);
  const set = (patch: Partial<DiagnoseInput>) => setInput((s) => ({ ...s, ...patch }));

  const point = useMemo(() => ({ lng: input.lng, lat: input.lat }), [input.lng, input.lat]);
  const result = useMemo(() => diagnose(data, input), [data, input]);
  const current = districtAt(data, input.lng, input.lat);

  const jumpTo = (a: number) => {
    const c = districtCenter(data.polys, a);
    if (!c) return;
    set({ lng: c[0], lat: c[1] });
    setFlyToken((t) => t + 1);
  };

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
      {/* 지도와 입력 */}
      <div>
        <div className="border border-border">
          <DiagnoseMap
            restaurants={data.restaurants}
            point={point}
            flyToken={flyToken}
            onSelect={(p) => set(p)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>지도를 눌러 숙소 위치를 고르세요. 빨간 점이 반경 500m 안 별 식당입니다.</p>
          <label className="flex items-center gap-2">
            <span className="shrink-0">구로 이동</span>
            <select
              className="border border-input bg-background px-2 py-1 text-foreground"
              value={current?.a ?? ""}
              onChange={(e) => jumpTo(Number(e.target.value))}
            >
              {!current && <option value="">선택</option>}
              {data.dist.map((d) => (
                <option key={d.a} value={d.a}>
                  {d.a}구 · {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form className="mt-10 grid gap-8 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <div className="sm:col-span-2">
            <Segmented label="객실 유형" options={ROOMS} value={input.room} onChange={(room) => set({ room })} />
          </div>
          <Range id="acc" label="수용 인원" unit="명" min={1} max={10} value={input.acc} onChange={(acc) => set({ acc })} />
          <Range id="bed" label="침실 수" unit="개" min={0} max={5} value={input.bed} onChange={(bed) => set({ bed })} />
          <div>
            <label htmlFor="price" className="text-sm font-bold">
              현재 1박 가격 (€)
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              value={input.price || ""}
              placeholder="예: 260"
              onChange={(e) => set({ price: Math.max(0, Number(e.target.value) || 0) })}
              className="mt-2 w-full border border-foreground bg-background px-3 py-2.5 font-mono text-lg tabular-nums outline-none focus:border-brand"
            />
          </div>
          <Segmented label="호스트 규모" options={HOSTS} value={input.host} onChange={(host) => set({ host })} />
        </form>
      </div>

      {/* 결과 */}
      <div aria-live="polite">
        <DiagnoseResultPanel result={result} input={input} />
      </div>
    </div>
  );
}
