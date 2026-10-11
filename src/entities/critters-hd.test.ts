import { DB32 } from '@constants';
import { drawBatFlying, drawBatHanging, drawBatLarge } from '@entities/bat';
import { drawBeeLarge } from '@entities/bees';
import { drawBird } from '@entities/bird';
import { drawBookworm } from '@entities/bookworm';
import { drawCat } from '@entities/cat';
import { drawCrab } from '@entities/crab';
import { glowfishHd, glowfishLargeHd, hareHd, mothHd, mothLargeHd, snailHd } from '@entities/critters-hd';
import { drawEel } from '@entities/eel';
import { drawLeaf, leafHd } from '@entities/falling-leaf';
import { drawFirefliesLarge } from '@entities/fireflies';
import { drawFish, drawFishLarge } from '@entities/fish';
import { drawFrog } from '@entities/frog';
import { drawGlowfish, drawGlowfishLarge } from '@entities/glowfish';
import { drawHare } from '@entities/hare';
import { drawHedgehog } from '@entities/hedgehog';
import { drawHen } from '@entities/hen';
import { drawMoth, drawMothLarge } from '@entities/moth';
import { drawMouse } from '@entities/mouse';
import { drawNewt } from '@entities/newt';
import { drawOwl } from '@entities/owl';
import { drawPigeon } from '@entities/pigeon';
import { drawPumpkin } from '@entities/pumpkin';
import { drawRabbit } from '@entities/rabbit';
import { drawSnail } from '@entities/snail';
import { drawSpider } from '@entities/spider';
import { record } from '@hd/classic-recorder';
import { type CritterLayers, critterHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';

type Draw = (g: Graphics) => void;

// Every pose of every creature the game draws, each with its HD recipe:
// the bundle's own where it drew one, the common recipe otherwise.
const CASES: [string, Draw, (() => CritterLayers)?][] = [
  ...[0, 1].map((f): [string, Draw, () => CritterLayers] => [`snail ${f}`, (g) => drawSnail(g, f), () => snailHd(f)]),
  ...[
    { bounding: false, ear: 0 },
    { bounding: false, ear: 1 },
    { bounding: true, ear: 0 },
  ].map((p): [string, Draw, () => CritterLayers] => [
    `hare ${JSON.stringify(p)}`,
    (g) => drawHare(g, p),
    () => hareHd(p),
  ]),
  ...[0, 1].flatMap((tail) =>
    [0, 0.25, 0.5, 0.75, 1].map((glow): [string, Draw, () => CritterLayers] => [
      `glowfish ${tail} ${glow}`,
      (g) => drawGlowfish(g, { tail, glow }),
      () => glowfishHd({ tail, glow }),
    ]),
  ),
  ['glowfish portrait', drawGlowfishLarge, glowfishLargeHd],
  ...[0, 1].map((f): [string, Draw, () => CritterLayers] => [`moth ${f}`, (g) => drawMoth(g, f), () => mothHd(f)]),
  ['moth portrait', drawMothLarge, mothLargeHd],
  ...[true, false].map((b): [string, Draw] => [`bat hanging ${b}`, (g) => drawBatHanging(g, b)]),
  ...[0, 1].map((f): [string, Draw] => [`bat flying ${f}`, (g) => drawBatFlying(g, f)]),
  ['bat portrait', drawBatLarge],
  ['bee portrait', drawBeeLarge],
  ...[0, 1].map((f): [string, Draw] => [`bird ${f}`, (g) => drawBird(g, f, DB32.valhalla)]),
  ...[0, 1].map((f): [string, Draw] => [`bookworm ${f}`, (g) => drawBookworm(g, f)]),
  ...[false, true].flatMap((stretching) =>
    [0, 1].map((flick): [string, Draw] => [`cat ${stretching} ${flick}`, (g) => drawCat(g, { stretching, flick })]),
  ),
  ...[0, 1].map((f): [string, Draw] => [`crab ${f}`, (g) => drawCrab(g, f)]),
  ...[0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9, 5.6].map((p): [string, Draw] => [`eel ${p}`, (g) => drawEel(g, p)]),
  ['fireflies portrait', drawFirefliesLarge],
  ...[0, 1].map((f): [string, Draw] => [`fish ${f}`, (g) => drawFish(g, f, DB32.tahitiGold)]),
  ['fish portrait', (g) => drawFishLarge(g, DB32.tahitiGold)],
  ...[false, true].flatMap((croak) =>
    [false, true].map((leaping): [string, Draw] => [
      `frog ${croak} ${leaping}`,
      (g) => drawFrog(g, { croak, leaping }),
    ]),
  ),
  ...[false, true].flatMap((curled) =>
    [0, 1].map((step): [string, Draw] => [`hedgehog ${curled} ${step}`, (g) => drawHedgehog(g, { curled, step })]),
  ),
  ...[false, true].map((p): [string, Draw] => [`hen ${p}`, (g) => drawHen(g, p)]),
  ...[0, 1].map((w): [string, Draw] => [`mouse ${w}`, (g) => drawMouse(g, w)]),
  ...[0, 1].map((s): [string, Draw] => [`newt ${s}`, (g) => drawNewt(g, s)]),
  ...[false, true].flatMap((blink) =>
    ([-1, 0, 1] as const).map((look): [string, Draw] => [`owl ${blink} ${look}`, (g) => drawOwl(g, { blink, look })]),
  ),
  ...[0, 1].map((b): [string, Draw] => [`pigeon ${b}`, (g) => drawPigeon(g, b)]),
  ['pumpkin', drawPumpkin],
  ...[0, 1].map((b): [string, Draw] => [`rabbit ${b}`, (g) => drawRabbit(g, b)]),
  ...[0, 1].map((w): [string, Draw] => [`spider ${w}`, (g) => drawSpider(g, w)]),
  ...[DB32.tahitiGold, DB32.clairvoyant, DB32.rainforest, DB32.twine].flatMap((color) =>
    [0, 1].map((flip): [string, Draw, () => CritterLayers] => [
      `leaf ${color} ${flip}`,
      (g) => drawLeaf(g, { color, flip }),
      () => leafHd({ color, flip }),
    ]),
  ),
];

describe('every creature in HD keeps its classic footprint', () => {
  for (const [name, classic, hd] of CASES) {
    it(name, () => {
      const recorded = record(classic);
      const layers = hd ? hd() : critterHd(recorded);
      expect(footprintDiff(recorded, layers.body)).toEqual([]);
    });
  }
});
