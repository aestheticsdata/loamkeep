import { DB32 } from '@constants';
import type { Vec2 } from '@types';
import type { Graphics } from 'pixi.js';

// The potting shed's furniture and landmarks, in classic: logical-px rects
// around (0, 0), base on y = 0 — or, for what hangs from a ceiling, the
// ceiling on y = 0 and the drawing going down. HD derives every one of them
// by the prop recipe (propHd) and the landmark one.
//
// Ported from design_handoff_potting_shed/prototype/shed-art.js (`P.*`).

// A disc of radius r, row by row.
function disc(g: Graphics, at: Vec2, r: number, color: number): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    g.rect(at.x - half, at.y + dy, half * 2 + 1, 1).fill(color);
  }
}

// A path of straight strokes between corners, one px thick: the spiral that
// runs through the house's landmarks.
function strokes(g: Graphics, corners: readonly (readonly [number, number])[], color: number): void {
  for (let i = 0; i + 1 < corners.length; i++) {
    const [ax, ay] = corners[i];
    const [bx, by] = corners[i + 1];
    g.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1).fill(color);
  }
}

// A terracotta pot standing on `base`.
function pot(g: Graphics, x: number, base: number): void {
  g.rect(x - 2, base - 4, 5, 4).fill(DB32.tahitiGold);
  g.rect(x - 3, base - 5, 7, 1).fill(DB32.rope);
  g.rect(x - 1, base - 1, 3, 1).fill(DB32.rope);
}

// ---------------------------------------------------------------- the shed

export function drawPottingBench(g: Graphics): void {
  g.rect(-17, -15, 34, 2).fill(DB32.rope);
  g.rect(-17, -15, 34, 1).fill(DB32.twine);
  g.rect(-15, -13, 2, 13).fill(DB32.oiledCedar);
  g.rect(13, -13, 2, 13).fill(DB32.oiledCedar);
  g.rect(-15, -5, 30, 1).fill(DB32.rope);
  pot(g, -10, -15);
  pot(g, -3, -15);
  g.rect(-3, -23, 1, 3).fill(DB32.dell);
  g.rect(-4, -22, 1, 1).fill(DB32.eltGreen);
  g.rect(-2, -21, 1, 1).fill(DB32.eltGreen);
  g.rect(4, -16, 6, 1).fill(DB32.heather);
  g.rect(9, -17, 3, 2).fill(DB32.oiledCedar);
  g.rect(-12, -8, 10, 3).fill(DB32.oiledCedar);
  for (const x of [-11, -8, -5]) g.rect(x, -9, 1, 1).fill(DB32.christi);
  g.rect(3, -4, 8, 4).fill(DB32.twine);
  g.rect(4, -5, 6, 1).fill(DB32.twine);
  g.rect(6, -5, 2, 1).fill(DB32.rope);
}

export function drawPots(g: Graphics): void {
  pot(g, -4, 0);
  pot(g, 3, 0);
  g.rect(-2, -9, 5, 4).fill(DB32.tahitiGold);
  g.rect(-3, -5, 7, 1).fill(DB32.rope);
}

export function drawRake(g: Graphics): void {
  for (let i = 0; i < 26; i++) g.rect(3 - Math.floor(i / 5), -1 - i, 1, 1).fill(DB32.rope);
  g.rect(-6, -30, 8, 1).fill(DB32.dimGray);
  for (const x of [-6, -4, -2, 0]) g.rect(x, -29, 1, 2).fill(DB32.dimGray);
}

// The shed's door from the inside, ajar: the way back out to the garden.
export function drawShedDoorInside(g: Graphics): void {
  g.rect(-11, -28, 22, 28).fill(DB32.oiledCedar);
  g.rect(-11, -28, 3, 28).fill(DB32.valhalla);
  g.rect(-11, -28, 22, 1).fill(DB32.rope);
  g.rect(6, -14, 2, 2).fill(DB32.twine);
  for (const x of [-4, 2]) g.rect(x, -27, 1, 27).fill(DB32.loulou);
}

// The window with the pot in it — the same panes and the same pot the
// garden sees from outside, with the evening behind them.
export function drawShedWindow(g: Graphics): void {
  g.rect(-16, -23, 32, 24).fill(DB32.oiledCedar);
  for (const [y, h, c] of [
    [-22, 6, DB32.smokeyAsh],
    [-16, 6, DB32.brown],
    [-10, 5, DB32.tahitiGold],
    [-5, 5, DB32.twine],
  ] as const) {
    g.rect(-15, y, 30, h).fill(c);
  }
  g.rect(-1, -22, 1, 22).fill(DB32.oiledCedar);
  g.rect(-15, -12, 30, 1).fill(DB32.oiledCedar);
  g.rect(-17, 0, 34, 2).fill(DB32.rope);
  g.rect(-17, 0, 34, 1).fill(DB32.twine);
  g.rect(-10, -6, 8, 6).fill(DB32.tahitiGold);
  g.rect(-11, -7, 10, 1).fill(DB32.rope);
  g.rect(-7, -10, 1, 4).fill(DB32.dell);
  g.rect(-8, -9, 1, 1).fill(DB32.eltGreen);
}

export function drawSmallWindow(g: Graphics): void {
  g.rect(-9, -15, 18, 16).fill(DB32.oiledCedar);
  for (const [y, h, c] of [
    [-14, 5, DB32.smokeyAsh],
    [-9, 5, DB32.brown],
    [-4, 4, DB32.tahitiGold],
  ] as const) {
    g.rect(-8, y, 16, h).fill(c);
  }
  g.rect(-1, -14, 1, 14).fill(DB32.oiledCedar);
  g.rect(-10, 0, 20, 1).fill(DB32.rope);
}

export function drawSkylight(g: Graphics): void {
  g.rect(-14, -6, 28, 7).fill(DB32.oiledCedar);
  g.rect(-12, -5, 24, 5).fill(DB32.deepKoamaru);
  g.rect(-12, -5, 24, 2).fill(DB32.smokeyAsh);
  g.rect(-1, -5, 1, 5).fill(DB32.oiledCedar);
  g.rect(5, -4, 1, 1).fill(DB32.lightSteel);
}

// ---------------------------------------------------------------- the hall and the kitchen

export function drawDrawerCabinet(g: Graphics): void {
  g.rect(-14, -40, 28, 40).fill(DB32.oiledCedar);
  g.rect(-14, -40, 28, 1).fill(DB32.rope);
  g.rect(-15, -42, 30, 2).fill(DB32.rope);
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) {
      g.rect(-12 + c * 6, -38 + r * 5, 5, 4).fill(DB32.rope);
      g.rect(-10 + c * 6, -36 + r * 5, 1, 1).fill(DB32.goldenFizz);
    }
  }
  g.rect(-14, -3, 28, 3).fill(DB32.loulou);
}

export function drawStove(g: Graphics): void {
  g.rect(-15, -20, 30, 20).fill(DB32.valhalla);
  g.rect(-16, -22, 32, 2).fill(DB32.dimGray);
  g.rect(-16, -22, 32, 1).fill(DB32.heather);
  g.rect(-12, -16, 11, 11).fill(DB32.opal);
  g.rect(-10, -11, 7, 1).fill(DB32.heather);
  g.rect(2, -16, 10, 9).fill(DB32.loulou);
  g.rect(3, -14, 8, 6).fill(DB32.tahitiGold);
  g.rect(4, -12, 6, 3).fill(DB32.goldenFizz);
  for (const x of [5, 8]) g.rect(x, -14, 1, 6).fill(DB32.valhalla);
  g.rect(2, -5, 10, 2).fill(DB32.dimGray);
  g.rect(9, -64, 4, 42).fill(DB32.opal);
  g.rect(9, -64, 1, 42).fill(DB32.dimGray);
  g.rect(-10, -28, 8, 6).fill(DB32.heather);
  g.rect(-9, -29, 6, 1).fill(DB32.heather);
  g.rect(-2, -27, 3, 1).fill(DB32.heather);
  g.rect(-8, -31, 4, 1).fill(DB32.topaz);
  g.rect(-7, -30, 2, 1).fill(DB32.topaz);
  g.rect(0, -24, 7, 2).fill(DB32.dimGray);
}

export function drawKitchenTable(g: Graphics): void {
  g.rect(-16, -12, 32, 2).fill(DB32.rope);
  g.rect(-16, -12, 32, 1).fill(DB32.twine);
  for (const x of [-15, 13]) g.rect(x, -10, 2, 10).fill(DB32.oiledCedar);
  g.rect(-6, -16, 6, 4).fill(DB32.lightSteel);
  g.rect(-6, -16, 6, 1).fill(DB32.white);
  g.rect(4, -14, 6, 2).fill(DB32.tahitiGold);
}

// A row of preserving jars, each with a lid and a streak of light down its
// glass.
export function drawJars(g: Graphics): void {
  for (const [x, h, c] of [
    [-24, 8, DB32.clairvoyant],
    [-14, 10, DB32.tahitiGold],
    [-4, 7, DB32.eltGreen],
    [6, 9, DB32.mandy],
    [16, 8, DB32.goldenFizz],
  ] as const) {
    g.rect(x, -h, 7, h).fill(c);
    g.rect(x, -h, 7, 2).fill(DB32.lightSteel);
    g.rect(x + 1, -h + 3, 1, h - 4).fill({ color: DB32.white, alpha: 0.4 });
  }
}

export function drawCandle(g: Graphics): void {
  g.rect(-3, -1, 6, 1).fill(DB32.rainforest);
  g.rect(-1, -7, 2, 6).fill(DB32.white);
  g.rect(-1, -7, 2, 1).fill(DB32.lightSteel);
  g.rect(0, -8, 1, 1).fill(DB32.valhalla);
  g.rect(0, -11, 1, 3).fill(DB32.goldenFizz);
  g.rect(0, -9, 1, 1).fill(DB32.tahitiGold);
}

// Hung from the ceiling.
export function drawHangingLamp(g: Graphics): void {
  g.rect(0, 0, 1, 10).fill(DB32.topaz);
  g.rect(-3, 10, 7, 2).fill(DB32.rainforest);
  g.rect(-2, 12, 5, 5).fill(DB32.goldenFizz);
  g.rect(-1, 13, 3, 3).fill(DB32.white);
  g.rect(-3, 17, 7, 1).fill(DB32.rainforest);
}

// Hung from the ceiling.
export function drawHerbs(g: Graphics): void {
  g.rect(0, 0, 1, 5).fill(DB32.twine);
  g.rect(-2, 5, 5, 7).fill(DB32.dell);
  g.rect(-1, 5, 3, 1).fill(DB32.rope);
  g.rect(-3, 7, 1, 3).fill(DB32.eltGreen);
  g.rect(3, 8, 1, 3).fill(DB32.eltGreen);
  g.rect(-1, 12, 1, 2).fill(DB32.dell);
  g.rect(1, 12, 1, 3).fill(DB32.dell);
}

// Hung from the ceiling.
export function drawLavender(g: Graphics): void {
  g.rect(0, 0, 1, 5).fill(DB32.twine);
  g.rect(-1, 5, 3, 6).fill(DB32.dell);
  g.rect(-1, 5, 3, 1).fill(DB32.rope);
  g.rect(-2, 11, 1, 4).fill(DB32.smokeyAsh);
  g.rect(0, 11, 1, 5).fill(DB32.smokeyAsh);
  g.rect(2, 11, 1, 4).fill(DB32.smokeyAsh);
  g.rect(0, 15, 1, 1).fill(DB32.mandy);
}

// Hung from the ceiling.
export function drawOnions(g: Graphics): void {
  g.rect(0, 0, 1, 16).fill(DB32.twine);
  for (const [x, y] of [
    [-3, 4],
    [1, 8],
    [-3, 12],
  ] as const) {
    g.rect(x, y, 4, 3).fill(DB32.twine);
    g.rect(x + 1, y - 1, 2, 1).fill(DB32.rope);
    g.rect(x + 1, y + 3, 2, 1).fill(DB32.pancho);
  }
}

// ---------------------------------------------------------------- upstairs

export function drawDressForm(g: Graphics): void {
  g.rect(-1, -6, 2, 6).fill(DB32.oiledCedar);
  g.rect(-4, -1, 8, 1).fill(DB32.oiledCedar);
  g.rect(-5, -20, 10, 7).fill(DB32.smokeyAsh);
  g.rect(-4, -13, 8, 7).fill(DB32.smokeyAsh);
  g.rect(-3, -22, 6, 2).fill(DB32.smokeyAsh);
  g.rect(-1, -24, 2, 2).fill(DB32.rainforest);
  g.rect(-5, -16, 10, 1).fill(DB32.twine);
  g.rect(2, -19, 1, 1).fill(DB32.goldenFizz);
}

export function drawDesk(g: Graphics): void {
  g.rect(-14, -11, 28, 2).fill(DB32.rope);
  g.rect(-14, -11, 28, 1).fill(DB32.twine);
  g.rect(-13, -9, 8, 9).fill(DB32.oiledCedar);
  g.rect(-12, -7, 6, 1).fill(DB32.rope);
  g.rect(-12, -4, 6, 1).fill(DB32.rope);
  g.rect(11, -9, 2, 9).fill(DB32.oiledCedar);
  g.rect(2, -14, 6, 3).fill(DB32.pancho);
  g.rect(5, -14, 1, 3).fill(DB32.twine);
  g.rect(-6, -12, 1, 1).fill(DB32.rainforest);
  g.rect(-6, -18, 1, 6).fill(DB32.rainforest);
  g.rect(-9, -21, 6, 3).fill(DB32.eltGreen);
  g.rect(-8, -18, 4, 1).fill(DB32.goldenFizz);
}

export function drawTrunk(g: Graphics): void {
  g.rect(-10, -11, 20, 11).fill(DB32.rope);
  g.rect(-10, -11, 20, 3).fill(DB32.oiledCedar);
  g.rect(-10, -11, 20, 1).fill(DB32.twine);
  g.rect(-7, -11, 2, 11).fill(DB32.oiledCedar);
  g.rect(5, -11, 2, 11).fill(DB32.oiledCedar);
  g.rect(-1, -8, 3, 3).fill(DB32.goldenFizz);
  g.rect(0, -7, 1, 1).fill(DB32.valhalla);
  g.rect(-10, -1, 20, 1).fill(DB32.oiledCedar);
}

export function drawSheetedTrunk(g: Graphics): void {
  g.rect(-6, -20, 10, 6).fill(DB32.heather);
  g.rect(-5, -20, 8, 1).fill(DB32.lightSteel);
  g.rect(-12, -14, 24, 12).fill(DB32.heather);
  g.rect(-11, -15, 22, 1).fill(DB32.lightSteel);
  g.rect(-13, -2, 26, 2).fill(DB32.heather);
  g.rect(-6, -13, 1, 11).fill(DB32.topaz);
  g.rect(3, -13, 1, 11).fill(DB32.topaz);
  g.rect(-10, -14, 8, 1).fill(DB32.lightSteel);
}

export function drawRockingHorse(g: Graphics): void {
  g.rect(-10, -2, 20, 1).fill(DB32.rope);
  g.rect(-11, -3, 2, 1).fill(DB32.rope);
  g.rect(9, -3, 2, 1).fill(DB32.rope);
  for (const x of [-6, -3, 2, 4]) g.rect(x, -7, 1, 5).fill(DB32.pancho);
  g.rect(-6, -11, 11, 4).fill(DB32.pancho);
  g.rect(4, -15, 3, 5).fill(DB32.pancho);
  g.rect(5, -17, 5, 3).fill(DB32.pancho);
  g.rect(3, -16, 1, 6).fill(DB32.oiledCedar);
  g.rect(-8, -11, 2, 4).fill(DB32.oiledCedar);
  g.rect(-3, -12, 5, 2).fill(DB32.clairvoyant);
  g.rect(8, -16, 1, 1).fill(DB32.valhalla);
  g.rect(-4, -10, 1, 1).fill(DB32.twine);
  g.rect(0, -9, 1, 1).fill(DB32.twine);
}

export function drawBed(g: Graphics): void {
  g.rect(-17, -6, 34, 4).fill(DB32.rope);
  g.rect(-17, -2, 2, 2).fill(DB32.oiledCedar);
  g.rect(15, -2, 2, 2).fill(DB32.oiledCedar);
  g.rect(-17, -16, 3, 12).fill(DB32.oiledCedar);
  g.rect(-17, -16, 3, 1).fill(DB32.rope);
  g.rect(14, -11, 3, 7).fill(DB32.oiledCedar);
  g.rect(-14, -9, 28, 3).fill(DB32.lightSteel);
  g.rect(-8, -10, 22, 4).fill(DB32.clairvoyant);
  for (const [x, y, c] of [
    [-6, -10, DB32.mandy],
    [-1, -8, DB32.mandy],
    [4, -10, DB32.twine],
    [9, -8, DB32.mandy],
  ] as const) {
    g.rect(x, y, 3, 2).fill(c);
  }
  g.rect(-8, -10, 22, 1).fill(DB32.brown);
  g.rect(-14, -11, 6, 3).fill(DB32.white);
}

// ---------------------------------------------------------------- the basement and the tunnels

export function drawAppleCrate(g: Graphics): void {
  g.rect(-8, -9, 16, 9).fill(DB32.rope);
  g.rect(-8, -6, 16, 1).fill(DB32.oiledCedar);
  g.rect(-8, -3, 16, 1).fill(DB32.oiledCedar);
  g.rect(-8, -9, 1, 9).fill(DB32.oiledCedar);
  g.rect(7, -9, 1, 9).fill(DB32.oiledCedar);
  for (const x of [-6, -3, 0, 3]) {
    g.rect(x, -11, 3, 2).fill(DB32.clairvoyant);
    g.rect(x, -11, 1, 1).fill(DB32.brown);
  }
  g.rect(-2, -12, 1, 1).fill(DB32.christi);
}

export function drawBoiler(g: Graphics): void {
  g.rect(-2, -50, 4, 18).fill(DB32.dimGray);
  g.rect(-2, -50, 1, 18).fill(DB32.heather);
  g.rect(-9, -33, 18, 3).fill(DB32.rope);
  g.rect(-11, -30, 22, 26).fill(DB32.rope);
  g.rect(-11, -30, 3, 26).fill(DB32.tahitiGold);
  for (const y of [-27, -16]) for (let x = -8; x <= 8; x += 4) g.rect(x, y, 1, 1).fill(DB32.twine);
  g.rect(-10, -4, 3, 4).fill(DB32.valhalla);
  g.rect(7, -4, 3, 4).fill(DB32.valhalla);
  g.rect(-5, -11, 10, 6).fill(DB32.valhalla);
  g.rect(-4, -9, 8, 3).fill(DB32.tahitiGold);
  g.rect(-3, -8, 6, 1).fill(DB32.goldenFizz);
  disc(g, { x: 5, y: -22 }, 2, DB32.pancho);
  g.rect(5, -23, 1, 2).fill(DB32.valhalla);
}

// Hung from the ceiling.
export function drawPipes(g: Graphics): void {
  g.rect(-32, 3, 64, 3).fill(DB32.dimGray);
  g.rect(-32, 3, 64, 1).fill(DB32.heather);
  for (const x of [-28, 0, 28]) g.rect(x, 0, 1, 3).fill(DB32.topaz);
  g.rect(14, 6, 3, 10).fill(DB32.dimGray);
  g.rect(14, 6, 1, 10).fill(DB32.heather);
  g.rect(12, 10, 7, 2).fill(DB32.rainforest);
  g.rect(15, 9, 1, 1).fill(DB32.goldenFizz);
}

// Hung from the ceiling.
export function drawRoots(g: Graphics): void {
  for (const [x, length] of [
    [-6, 10],
    [-2, 16],
    [3, 8],
    [6, 13],
  ] as const) {
    g.rect(x, 0, 1, length).fill(DB32.rope);
    g.rect(x, length, 1, 1).fill(DB32.twine);
    g.rect(x + (x < 0 ? -1 : 1), Math.floor(length / 2), 1, 3).fill(DB32.rope);
  }
}

// ---------------------------------------------------------------- the landmarks, in the world and on the page

// The seed hall's clock, its hands winding in toward the middle of the dial.
export function drawGrandfatherClock(g: Graphics): void {
  g.rect(-7, -8, 14, 8).fill(DB32.oiledCedar);
  g.rect(-7, -8, 14, 1).fill(DB32.rope);
  g.rect(-5, -30, 10, 22).fill(DB32.oiledCedar);
  g.rect(-5, -30, 1, 22).fill(DB32.rope);
  g.rect(-2, -26, 4, 14).fill(DB32.valhalla);
  g.rect(0, -26, 1, 10).fill(DB32.rainforest);
  g.rect(-1, -17, 3, 3).fill(DB32.goldenFizz);
  g.rect(-7, -44, 14, 14).fill(DB32.oiledCedar);
  g.rect(-7, -44, 14, 1).fill(DB32.rope);
  g.rect(-5, -46, 10, 2).fill(DB32.oiledCedar);
  g.rect(-1, -48, 2, 2).fill(DB32.goldenFizz);
  disc(g, { x: 0, y: -37 }, 5, DB32.pancho);
  for (const [x, y] of [
    [0, -41],
    [3, -38],
    [0, -34],
    [-3, -37],
    [-1, -39],
    [1, -36],
  ] as const) {
    g.rect(x, y, 1, 1).fill(DB32.valhalla);
  }
  g.rect(0, -39, 1, 2).fill(DB32.valhalla);
  g.rect(0, -37, 2, 1).fill(DB32.valhalla);
}

export function drawClockSketch(g: Graphics): void {
  g.rect(-14, -30, 28, 60).fill(DB32.oiledCedar);
  g.rect(-14, -30, 28, 2).fill(DB32.rope);
  disc(g, { x: 0, y: -10 }, 12, DB32.pancho);
  strokes(
    g,
    [
      [-9, -19],
      [9, -19],
      [9, -1],
      [-6, -1],
      [-6, -15],
      [6, -15],
      [6, -5],
      [-3, -5],
      [-3, -11],
      [2, -11],
    ],
    DB32.valhalla,
  );
  g.rect(-5, 6, 10, 20).fill(DB32.valhalla);
  g.rect(0, 6, 1, 13).fill(DB32.rainforest);
  disc(g, { x: 0, y: 21 }, 3, DB32.goldenFizz);
}

// The library's seed catalogue, open on its stand.
export function drawSeedCatalogue(g: Graphics): void {
  g.rect(-1, -14, 3, 14).fill(DB32.oiledCedar);
  g.rect(-5, -2, 11, 2).fill(DB32.oiledCedar);
  g.rect(-8, -18, 16, 4).fill(DB32.rope);
  g.rect(-8, -18, 16, 1).fill(DB32.twine);
  g.rect(-7, -21, 6, 3).fill(DB32.pancho);
  g.rect(1, -21, 6, 3).fill(DB32.pancho);
  g.rect(-1, -21, 2, 3).fill(DB32.clairvoyant);
  g.rect(-6, -20, 4, 1).fill(DB32.twine);
  g.rect(2, -20, 4, 1).fill(DB32.twine);
  g.rect(3, -19, 1, 1).fill(DB32.dell);
}

export function drawCatalogueSketch(g: Graphics): void {
  g.rect(-30, -22, 29, 40).fill(DB32.pancho);
  g.rect(1, -22, 29, 40).fill(DB32.pancho);
  g.rect(-1, -22, 2, 40).fill(DB32.clairvoyant);
  g.rect(-30, 18, 60, 2).fill(DB32.rope);
  for (const [x, y] of [
    [-24, -14],
    [-14, -14],
    [-24, -2],
    [-14, -2],
  ] as const) {
    disc(g, { x, y }, 3, DB32.rope);
    g.rect(x - 4, y + 5, 9, 1).fill(DB32.twine);
    g.rect(x, y - 6, 1, 3).fill(DB32.dell);
  }
  g.rect(6, -16, 20, 24).fill(DB32.twine);
  g.rect(6, -16, 20, 2).fill(DB32.rope);
  strokes(
    g,
    [
      [10, -11],
      [22, -11],
      [22, 4],
      [13, 4],
      [13, -6],
      [19, -6],
      [19, 0],
      [16, 0],
    ],
    DB32.valhalla,
  );
}

// A round window: the evening in bands, and the pot's silhouette standing
// in it, the same pot as the shed's.
function roundWindow(g: Graphics, centre: Vec2, r: number): void {
  const { x: cx, y: cy } = centre;
  disc(g, centre, r + 2, DB32.oiledCedar);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    const t = (dy + r) / (2 * r);
    const band = t < 0.3 ? DB32.smokeyAsh : t < 0.55 ? DB32.brown : t < 0.75 ? DB32.tahitiGold : DB32.twine;
    g.rect(cx - half, cy + dy, half * 2 + 1, 1).fill(band);
  }
  for (const [x0, w, top] of [
    [-0.8, 0.3, 0.62],
    [-0.45, 0.25, 0.7],
    [-0.15, 0.35, 0.58],
    [0.25, 0.3, 0.66],
    [0.5, 0.3, 0.74],
  ] as const) {
    for (let dy = Math.round(top * 2 * r - r); dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      const a = Math.max(cx - half, cx + Math.round(x0 * r));
      const b = Math.min(cx + half, cx + Math.round((x0 + w) * r));
      if (b > a) g.rect(a, cy + dy, b - a, 1).fill(DB32.valhalla);
    }
  }
  g.rect(cx, cy - r, 1, 2 * r).fill(DB32.oiledCedar);
  g.rect(cx - r, cy, 2 * r, 1).fill(DB32.oiledCedar);
}

// The eaves bedroom's window — the shed's little window, door-sized.
export function drawWrongSizeWindow(g: Graphics): void {
  roundWindow(g, { x: 0, y: -40 }, 22);
  g.rect(-26, -17, 52, 2).fill(DB32.rope);
  g.rect(-26, -17, 52, 1).fill(DB32.twine);
  g.rect(8, -23, 8, 6).fill(DB32.tahitiGold);
  g.rect(7, -24, 10, 1).fill(DB32.rope);
  g.rect(11, -27, 1, 3).fill(DB32.dell);
  g.rect(10, -26, 1, 1).fill(DB32.eltGreen);
}

export function drawWindowSketch(g: Graphics): void {
  roundWindow(g, { x: 0, y: -4 }, 26);
  g.rect(-30, 24, 60, 3).fill(DB32.rope);
  g.rect(-30, 24, 60, 1).fill(DB32.twine);
  g.rect(10, 18, 8, 6).fill(DB32.tahitiGold);
  g.rect(9, 17, 10, 1).fill(DB32.rope);
  g.rect(13, 14, 1, 3).fill(DB32.dell);
}

// The boot room's dumbwaiter, with a cup of tea in it.
export function drawDumbwaiter(g: Graphics): void {
  g.rect(-9, -26, 18, 22).fill(DB32.oiledCedar);
  g.rect(-9, -26, 18, 1).fill(DB32.rope);
  g.rect(-7, -24, 14, 18).fill(DB32.valhalla);
  g.rect(0, -24, 1, 9).fill(DB32.twine);
  g.rect(-6, -15, 12, 9).fill(DB32.rope);
  g.rect(-6, -15, 12, 1).fill(DB32.twine);
  g.rect(-2, -18, 4, 3).fill(DB32.lightSteel);
  g.rect(2, -17, 1, 1).fill(DB32.lightSteel);
  g.rect(-3, -28, 6, 2).fill(DB32.dimGray);
  g.rect(-10, -6, 20, 2).fill(DB32.rope);
}

export function drawDumbwaiterSketch(g: Graphics): void {
  g.rect(-24, -30, 48, 52).fill(DB32.oiledCedar);
  g.rect(-20, -26, 40, 44).fill(DB32.valhalla);
  g.rect(0, -30, 1, 22).fill(DB32.twine);
  g.rect(-16, -8, 32, 22).fill(DB32.rope);
  g.rect(-16, -8, 32, 2).fill(DB32.twine);
  g.rect(-6, -16, 10, 8).fill(DB32.lightSteel);
  g.rect(4, -14, 3, 4).fill(DB32.lightSteel);
  g.rect(-5, -16, 8, 2).fill(DB32.rope);
  g.rect(-26, 18, 52, 4).fill(DB32.rope);
}

// The roots at the end of the last tunnel, labelled, turning the same way:
// the spiral at `scale`, standing on `base`.
function rootSpiral(g: Graphics, scale: number, base: number): void {
  const corners = (
    [
      [-14, -24],
      [14, -24],
      [14, -4],
      [-10, -4],
      [-10, -20],
      [10, -20],
      [10, -8],
      [-6, -8],
      [-6, -16],
      [6, -16],
      [6, -12],
      [-2, -12],
    ] as const
  ).map(([x, y]) => [Math.round(x * scale), Math.round((y + 14) * scale) + base] as const);
  strokes(g, corners, DB32.rope);
  for (const i of [0, 2, 5, 9]) {
    const [x, y] = corners[i];
    g.rect(x - 1, y + 1, 4, 3).fill(DB32.pancho);
    g.rect(x, y + 2, 2, 1).fill(DB32.valhalla);
  }
}

export function drawRootMap(g: Graphics): void {
  g.rect(-3, -4, 6, 4).fill(DB32.rope);
  rootSpiral(g, 1, -14);
}

export function drawRootMapSketch(g: Graphics): void {
  rootSpiral(g, 2, 0);
}
