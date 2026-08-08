// Deterministic, seeded trailing series for sparkline/bar-chart decoration —
// e.g. "last 7 days" trend context that this fresh demo has no real history for.
// Stable across re-renders (same seed -> same shape) and always anchored to the
// real current value as its last point, so it stays grounded in live state.

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pseudoTrailingSeries(seedStr: string, points: number, endValue: number, volatility = 0.32): number[] {
  const rand = mulberry32(hashStr(seedStr))
  const base = Math.max(4, endValue)
  const arr: number[] = []
  let v = base * (0.5 + rand() * 0.35)
  for (let i = 0; i < points - 1; i++) {
    v = Math.max(0, v + (rand() - 0.42) * base * volatility)
    arr.push(v)
  }
  arr.push(endValue)
  return arr.map((x) => Math.round(x))
}
