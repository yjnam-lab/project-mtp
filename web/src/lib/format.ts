// 화면 숫자 표기

/** 0.4176 → "41.8%", sign이면 "+41.8%" */
export function formatPct(ratio: number, { digits = 1, sign = false } = {}): string {
  const s = `${(ratio * 100).toFixed(digits)}%`;
  return sign && ratio > 0 ? `+${s}` : s;
}

/** 31974 → "€31,974" */
export function formatEuro(value: number): string {
  return `€${Math.round(value).toLocaleString("en-US")}`;
}

/** 35058 → "35,058" */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
