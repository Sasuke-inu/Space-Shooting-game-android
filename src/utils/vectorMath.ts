// ------------------------------------------------------------------ //
//                    Vector helpers (small + fast)
// ------------------------------------------------------------------ //

import type { Vec2 } from "../types/game"

/** tiny constructor */
export const v = (x = 0, y = 0): Vec2 => ({ x, y })

/** immutable ops (pure functions) */
export const add = (a: Vec2, b: Vec2) => v(a.x + b.x, a.y + b.y)
export const sub = (a: Vec2, b: Vec2) => v(a.x - b.x, a.y - b.y)
export const mul = (a: Vec2, s: number) => v(a.x * s, a.y * s)
export const len = (a: Vec2) => Math.hypot(a.x, a.y)
export const nor = (a: Vec2) => {
  const L = len(a)
  return L === 0 ? v() : v(a.x / L, a.y / L)
}
export const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, x))
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const angleOf = (a: Vec2) => Math.atan2(a.y, a.x)
export const fromAngle = (ang: number, mag = 1) =>
  v(Math.cos(ang) * mag, Math.sin(ang) * mag)
export const dist2 = (a: Vec2, b: Vec2) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/** wrap a position at edges so the world is toroidal (Asteroids-like) */
export const wrap = (p: Vec2, w: number, h: number) =>
  v(((p.x % w) + w) % w, ((p.y % h) + h) % h)
