/**
 * mulberry32: 32-bit seeded PRNG. ~30 LoC, no deps.
 * Returns a factory function that, when called, yields the next uniform [0, 1) value.
 */
export const DEFAULT_SEED = 42
export const DEFAULT_ITERATIONS = 10_000

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
