import { DB32 } from '@constants';

// The HD pass shades by stepping along a ramp, never by inventing a tone (L4).
// Every DB32 tone the art uses knows its lit neighbour and its shadow
// neighbour, both DB32. A tone that is not in the map has no ramp: `hiOf` and
// `loOf` hand it back unchanged, so a pass that asks for its shade leaves it be.
//
// Verbatim from design_handoff_hd_pass/prototype/engine.js.
export const RAMP: ReadonlyMap<number, readonly [lit: number, shade: number]> = new Map([
  [DB32.white, [DB32.white, DB32.lightSteel]],
  [DB32.lightSteel, [DB32.white, DB32.heather]],
  [DB32.heather, [DB32.lightSteel, DB32.topaz]],
  [DB32.topaz, [DB32.heather, DB32.dimGray]],
  [DB32.dimGray, [DB32.topaz, DB32.verdigris]],
  [DB32.verdigris, [DB32.dimGray, DB32.opal]],
  [DB32.opal, [DB32.verdigris, DB32.valhalla]],
  [DB32.valhalla, [DB32.deepKoamaru, DB32.black]],
  [DB32.pancho, [DB32.white, DB32.twine]],
  [DB32.twine, [DB32.pancho, DB32.rope]],
  [DB32.rope, [DB32.twine, DB32.oiledCedar]],
  [DB32.oiledCedar, [DB32.rope, DB32.loulou]],
  [DB32.loulou, [DB32.oiledCedar, DB32.valhalla]],
  [DB32.atlantis, [DB32.atlantis, DB32.christi]],
  [DB32.christi, [DB32.atlantis, DB32.eltGreen]],
  [DB32.eltGreen, [DB32.christi, DB32.dell]],
  [DB32.dell, [DB32.eltGreen, DB32.opal]],
  [DB32.viking, [DB32.lightSteel, DB32.venice]],
  [DB32.venice, [DB32.cornflower, DB32.deepKoamaru]],
  [DB32.deepKoamaru, [DB32.royalBlue, DB32.valhalla]],
  [DB32.mandy, [DB32.pancho, DB32.smokeyAsh]],
  [DB32.clairvoyant, [DB32.brown, DB32.loulou]],
  [DB32.brown, [DB32.pancho, DB32.clairvoyant]],
]);

export function hiOf(color: number): number {
  return RAMP.get(color)?.[0] ?? color;
}

export function loOf(color: number): number {
  return RAMP.get(color)?.[1] ?? color;
}

// Ordered 4×4 Bayer. `bayer(x, y) < t` puts the second tone down at density t,
// so 0.25 / 0.5 / 0.75 are the three densities the laws allow (L5). Indexed by
// the low two bits of the coordinate, which for a negative coordinate is still
// the right cell of the repeating pattern.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function bayer(x: number, y: number): number {
  return (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
}
