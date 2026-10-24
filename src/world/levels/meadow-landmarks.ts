import { DB32, TILE_SIZE } from '@constants';
import type { LandmarkSpec } from '@entities/landmark';
import { GRANITE } from '@world/tilemap';

// The meadow's landmarks: the seven it has always had, moved onto the new
// map, and the fifteen the v3 rebuild adds. Each stands where its marker is
// on the handoff's map (design_handoff_meadow_v3/meadow-v3-markers.json):
// x is the middle of the marker's column, y the top of the tile it stands on.

// A landmark's base at the middle of a column, on a row's top edge.
const at = (col: number, row: number) => ({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE });

// Standard ink color depending on discovered state for landmark bodies.
const inkFor = (discovered: boolean): number => (discovered ? DB32.opal : DB32.valhalla);

// A tone, or the grey it fades to once the landmark is in the book: dimGray
// for the mid tones, heather for the light ones.
const muted = (discovered: boolean, live: number, logged: number = DB32.dimGray): number =>
  discovered ? logged : live;

// The numbers are the markers'.

export const MEADOW_LANDMARKS: LandmarkSpec[] = [
  // 2) Old Cairn — the forest edge's grass, far left, a few steps from the
  //    starting cairn.
  {
    id: 'old-cairn',
    ...at(2, 20),
    name: 'Old Cairn',
    description:
      'A stack of stones, placed with care. Each one chosen, each one balanced. ' +
      'No one remembers who built them, or why.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      g.rect(-5, -3, 10, 3).fill(stone);
      g.rect(-5, -3, 10, 1).fill(stoneHi);
      g.rect(-5, -3, 1, 3).fill(ink);
      g.rect(4, -3, 1, 3).fill(ink);
      g.rect(-5, -1, 10, 1).fill(ink);
      g.rect(-3, -6, 6, 3).fill(stone);
      g.rect(-3, -6, 6, 1).fill(stoneHi);
      g.rect(-3, -6, 1, 3).fill(ink);
      g.rect(2, -6, 1, 3).fill(ink);
      g.rect(-2, -9, 4, 3).fill(stone);
      g.rect(-2, -9, 4, 1).fill(stoneHi);
      g.rect(-2, -9, 1, 3).fill(ink);
      g.rect(1, -9, 1, 3).fill(ink);
      g.rect(-1, -10, 2, 1).fill(stoneHi);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-22, 12, 44, 8).fill(stone).rect(-22, 12, 44, 1).fill(stoneHi);
      g.rect(-16, 0, 32, 12).fill(stone).rect(-16, 0, 32, 1).fill(stoneHi);
      g.rect(-12, -12, 24, 12).fill(stone).rect(-12, -12, 24, 1).fill(stoneHi);
      g.rect(-6, -22, 12, 10).fill(stoneHi);
      g.rect(-10, 4, 5, 1).fill(ink);
      g.rect(0, -6, 6, 1).fill(ink);
      g.rect(-5, 15, 8, 1).fill(ink);
    },
  },

  // 3) Stone Marker — the low timber branch at row 17 (cols 3-7).
  {
    id: 'stone-marker',
    ...at(5, 17),
    name: 'Stone Marker',
    description: 'An old marker, carved with worn symbols. The carvings spiral upward — almost forming a face.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const fill = discovered ? DB32.dimGray : DB32.pancho;
      const baseFill = discovered ? DB32.opal : DB32.oiledCedar;
      g.rect(-3, -2, 6, 2).fill(baseFill);
      g.rect(-3, -2, 6, 1).fill(ink);
      g.rect(-2, -14, 4, 12).fill(fill);
      g.rect(-2, -14, 4, 1).fill(ink);
      g.rect(-2, -3, 4, 1).fill(ink);
      g.rect(-2, -14, 1, 12).fill(ink);
      g.rect(1, -14, 1, 12).fill(ink);
      g.rect(-3, -16, 6, 2).fill(fill);
      g.rect(-3, -16, 6, 1).fill(ink);
      g.rect(-3, -16, 1, 2).fill(ink);
      g.rect(2, -16, 1, 2).fill(ink);
      g.rect(-1, -11, 2, 1).fill(ink);
      g.rect(-1, -7, 2, 1).fill(ink);
    },
    drawSketch(g) {
      g.rect(-10, 16, 20, 4).fill(DB32.oiledCedar);
      g.rect(-7, -20, 14, 36).fill(DB32.heather);
      g.rect(-10, -24, 20, 4).fill(DB32.lightSteel);
      for (let i = 0; i < 4; i++) {
        g.rect(-4, -14 + i * 8, 8, 1).fill(DB32.dimGray);
      }
    },
  },

  // 6) Ruined Arch — the very top of the canopy, the row-3 branch (cols
  //    21-30), reached up the long vine at col 22.
  {
    id: 'ruined-arch',
    ...at(26, 3),
    name: 'Ruined Arch',
    description:
      "What's left of a doorway, half sunken into the soil. " +
      "The other half is gone. You can't tell what was once on the other side.",
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      g.rect(-5, -10, 2, 10).fill(stone);
      g.rect(-5, -10, 2, 1).fill(stoneHi);
      g.rect(-5, -10, 1, 10).fill(ink);
      g.rect(-4, -10, 1, 1).fill(ink);
      g.rect(-5, -1, 2, 1).fill(ink);
      g.rect(3, -10, 2, 10).fill(stone);
      g.rect(3, -10, 2, 1).fill(stoneHi);
      g.rect(4, -10, 1, 10).fill(ink);
      g.rect(3, -10, 1, 1).fill(ink);
      g.rect(3, -1, 2, 1).fill(ink);
      g.rect(-5, -12, 3, 2).fill(stone);
      g.rect(-5, -12, 3, 1).fill(stoneHi);
      g.rect(-5, -12, 1, 2).fill(ink);
      g.rect(2, -12, 3, 2).fill(stone);
      g.rect(2, -12, 3, 1).fill(stoneHi);
      g.rect(4, -12, 1, 2).fill(ink);
      g.rect(-1, -1, 2, 1).fill(stone);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      g.rect(-22, -16, 8, 36).fill(stone).rect(-22, -16, 8, 1).fill(stoneHi);
      g.rect(14, -16, 8, 36).fill(stone).rect(14, -16, 8, 1).fill(stoneHi);
      g.rect(-22, -22, 12, 6).fill(stone).rect(-22, -22, 12, 1).fill(stoneHi);
      g.rect(10, -22, 12, 6).fill(stone).rect(10, -22, 12, 1).fill(stoneHi);
      g.rect(-18, -10, 1, 12).fill(ink);
      g.rect(18, -8, 1, 14).fill(ink);
      g.rect(-8, 18, 4, 2).fill(stone);
      g.rect(2, 19, 5, 1).fill(stone);
    },
  },

  // 12) Hollow Tree — the stream & mill's grass, just past the vine down to
  //     the Root Shaft.
  {
    id: 'hollow-tree',
    ...at(57, 20),
    name: 'Hollow Tree',
    description:
      'A trunk hollowed out by time. Inside, the air smells of old paper. ' +
      'Someone — or something — was here recently. Or perhaps very long ago.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const wood = discovered ? DB32.dimGray : DB32.oiledCedar;
      const woodHi = discovered ? DB32.heather : DB32.rope;
      const cavity = DB32.valhalla;
      g.rect(-4, -13, 8, 13).fill(wood);
      g.rect(-4, -13, 8, 1).fill(woodHi);
      g.rect(-4, -13, 1, 13).fill(ink);
      g.rect(3, -13, 1, 13).fill(ink);
      g.rect(-2, -9, 4, 5).fill(cavity);
      g.rect(-2, -9, 4, 1).fill(ink);
      g.rect(-2, -5, 4, 1).fill(ink);
      g.rect(-5, -2, 10, 2).fill(wood);
      g.rect(-5, -2, 10, 1).fill(ink);
      g.rect(-5, -2, 1, 2).fill(ink);
      g.rect(4, -2, 1, 2).fill(ink);
      g.rect(-3, -11, 1, 1).fill(ink);
      g.rect(2, -7, 1, 1).fill(ink);
    },
    drawSketch(g) {
      const wood = DB32.oiledCedar;
      const woodHi = DB32.rope;
      const cavity = DB32.valhalla;
      const ink = DB32.valhalla;
      g.rect(-14, -28, 28, 44).fill(wood);
      g.rect(-14, -28, 28, 2).fill(woodHi);
      g.rect(-20, 12, 40, 8).fill(wood);
      g.rect(-20, 12, 40, 2).fill(woodHi);
      g.rect(-8, -14, 16, 22).fill(cavity);
      g.rect(-8, -14, 16, 2).fill(ink);
      for (let i = 0; i < 4; i++) {
        g.rect(-12, -20 + i * 8, 4, 1).fill(ink);
        g.rect(8, -20 + i * 8, 4, 1).fill(ink);
      }
    },
  },

  // 28) Crystal Vein — on the crag at the top of the cliff (row 4).
  {
    id: 'crystal-vein',
    ...at(185, 4),
    name: 'Crystal Vein',
    description:
      'A vein of pale blue crystal, breaking through the soil. They hum faintly when you stand close — ' +
      'just on the edge of being heard.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const cLight = discovered ? DB32.heather : DB32.viking;
      const cMid = discovered ? DB32.dimGray : DB32.cornflower;
      const cDark = discovered ? DB32.opal : DB32.venice;
      const baseStone = discovered ? DB32.dimGray : DB32.heather;
      g.rect(-4, -2, 8, 2).fill(baseStone);
      g.rect(-4, -2, 8, 1).fill(ink);
      g.rect(-1, -12, 2, 1).fill(cDark);
      g.rect(-1, -11, 2, 1).fill(cMid);
      g.rect(-2, -10, 4, 6).fill(cLight);
      g.rect(-2, -10, 1, 6).fill(cMid);
      g.rect(1, -10, 1, 6).fill(cMid);
      g.rect(-2, -4, 4, 1).fill(cMid);
      g.rect(2, -6, 1, 1).fill(cDark);
      g.rect(2, -5, 2, 3).fill(cLight);
      g.rect(2, -5, 2, 1).fill(cMid);
      g.rect(-4, -4, 1, 1).fill(cMid);
      g.rect(-4, -3, 2, 1).fill(cLight);
    },
    drawSketch(g) {
      const cLight = DB32.viking;
      const cMid = DB32.cornflower;
      const cDark = DB32.venice;
      const baseStone = DB32.heather;
      const ink = DB32.valhalla;
      g.rect(-22, 12, 44, 8).fill(baseStone);
      g.rect(-22, 12, 44, 1).fill(DB32.lightSteel);
      g.rect(-22, 19, 44, 1).fill(ink);
      g.rect(-4, -24, 8, 4).fill(cDark);
      g.rect(-8, -20, 16, 8).fill(cMid);
      g.rect(-10, -12, 20, 20).fill(cLight);
      g.rect(-10, -12, 20, 1).fill(DB32.white);
      g.rect(-2, -22, 1, 28).fill(cMid);
      g.rect(2, -22, 1, 28).fill(cDark);
      g.rect(10, -8, 5, 5).fill(cDark);
      g.rect(8, -3, 9, 14).fill(cLight);
      g.rect(8, -3, 9, 1).fill(DB32.white);
    },
  },

  // 38) Sunken Stone — moved to the floor of the Black Pool, under the
  //     forest edge, between its pillars. Reached by swimming down.
  {
    id: 'sunken-stone',
    ...at(28, 74),
    name: 'Sunken Stone',
    description:
      'A worn obelisk standing knee-deep in still water. Its surface is covered in tiny scratches — ' +
      'too regular to be erosion, too faint to read.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.lightSteel;
      const stoneHi = discovered ? DB32.heather : DB32.white;
      // Tall narrow obelisk poking out of the water.
      g.rect(-2, -14, 4, 14).fill(stone);
      g.rect(-2, -14, 4, 1).fill(stoneHi);
      g.rect(-2, -14, 1, 14).fill(ink);
      g.rect(1, -14, 1, 14).fill(ink);
      // Tip taper (1px narrower at top).
      g.rect(-1, -16, 2, 2).fill(stone);
      g.rect(-1, -16, 2, 1).fill(stoneHi);
      // Faint scratch marks.
      g.rect(-1, -11, 2, 1).fill(ink);
      g.rect(-1, -7, 2, 1).fill(ink);
      g.rect(-1, -4, 2, 1).fill(ink);
    },
    drawSketch(g) {
      const stone = DB32.lightSteel;
      const stoneHi = DB32.white;
      const ink = DB32.valhalla;
      const water = DB32.venice;
      // Tall obelisk.
      g.rect(-8, -28, 16, 44).fill(stone);
      g.rect(-8, -28, 16, 2).fill(stoneHi);
      g.rect(-4, -34, 8, 6).fill(stone);
      g.rect(-4, -34, 8, 2).fill(stoneHi);
      // Water at its base.
      g.rect(-24, 16, 48, 6).fill(water);
      g.rect(-24, 16, 48, 1).fill(DB32.cornflower);
      // Scratch marks all along the obelisk.
      for (let i = 0; i < 6; i++) {
        g.rect(-4, -22 + i * 6, 8, 1).fill(ink);
      }
    },
  },

  // 42) Spiral Fossil — in a closed pocket on the maze's middle level (cols
  //     4-7, rows 81-83), reached by the ladder at col 5. The pocket is three
  //     tiles high, so the drawing stays under 28 px.
  {
    id: 'spiral-fossil',
    ...at(6, 84),
    name: 'Spiral Fossil',
    description:
      'A shell turned to stone, coiled tight inside the rock. It is the spiral — the one on the Marker, ' +
      'the Throne, the tomb — pressed here long before anyone was alive to carve it.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const rock = discovered ? DB32.opal : DB32.topaz;
      const rockHi = discovered ? DB32.dimGray : DB32.heather;
      const shell = discovered ? DB32.dimGray : DB32.twine;
      const shellHi = discovered ? DB32.heather : DB32.pancho;

      // The slab of rock it sits in.
      g.rect(-9, -20, 18, 20).fill(rock);
      g.rect(-9, -20, 18, 1).fill(rockHi);
      g.rect(-9, -20, 1, 20).fill(ink);
      g.rect(8, -20, 1, 20).fill(ink);
      // The shell: a square coil, outside in.
      g.rect(-6, -17, 12, 12).fill(shell);
      g.rect(-6, -17, 12, 1).fill(shellHi);
      g.rect(-6, -17, 1, 12).fill(ink);
      g.rect(5, -17, 1, 12).fill(ink);
      g.rect(-6, -6, 12, 1).fill(ink);
      g.rect(-4, -15, 8, 1).fill(ink);
      g.rect(-4, -15, 1, 7).fill(ink);
      g.rect(-4, -9, 7, 1).fill(ink);
      g.rect(2, -13, 1, 5).fill(ink);
      g.rect(-2, -13, 4, 1).fill(ink);
      g.rect(-2, -13, 1, 3).fill(ink);
    },
    drawSketch(g) {
      const rock = DB32.topaz;
      const shell = DB32.twine;
      const shellHi = DB32.pancho;
      const ink = DB32.valhalla;
      // Rock.
      g.rect(-26, -26, 52, 46).fill(rock);
      g.rect(-26, -26, 52, 2).fill(DB32.heather);
      // Shell, coiled square — each ring 2 px of ink inside the last.
      g.rect(-18, -20, 36, 36).fill(shell);
      g.rect(-18, -20, 36, 2).fill(shellHi);
      g.rect(-18, -20, 2, 36).fill(ink);
      g.rect(16, -20, 2, 36).fill(ink);
      g.rect(-18, 14, 36, 2).fill(ink);
      g.rect(-12, -14, 26, 2).fill(ink);
      g.rect(-12, -14, 2, 24).fill(ink);
      g.rect(-12, 8, 22, 2).fill(ink);
      g.rect(8, -8, 2, 18).fill(ink);
      g.rect(-6, -8, 16, 2).fill(ink);
      g.rect(-6, -8, 2, 12).fill(ink);
      g.rect(-6, 2, 9, 2).fill(ink);
      g.rect(1, -2, 2, 6).fill(ink);
      // Ribs across the outer whorl.
      for (let i = 0; i < 5; i++) {
        g.rect(-15 + i * 7, -18, 1, 3).fill(ink);
      }
    },
  },
  // ---------------------------------------------------------------------------
  // The fifteen the v3 rebuild adds.
  // ---------------------------------------------------------------------------

  // 5) Woodcutter's Stump — on the row-12 branch of the canopy (cols 29-33),
  //    up the vine at col 28.
  {
    id: 'woodcutters-stump',
    ...at(31, 12),
    name: "Woodcutter's Stump",
    description:
      'A stump, sawn level, with an axe still bitten into it. Someone climbed all the way up here to fell a ' +
      'single branch, then left the axe and never came back for it.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const wood = muted(discovered, DB32.oiledCedar);
      const top = muted(discovered, DB32.twine, DB32.heather);
      // The stump, flaring into its roots at the foot.
      g.rect(-5, -7, 10, 7).fill(wood);
      g.rect(-6, -2, 12, 2).fill(wood);
      g.rect(-5, -7, 1, 7).fill(ink);
      g.rect(4, -7, 1, 7).fill(ink);
      // The sawn top, with its rings.
      g.rect(-5, -8, 10, 2).fill(top);
      g.rect(-3, -8, 6, 1).fill(muted(discovered, DB32.rope));
      g.rect(-1, -8, 2, 1).fill(top);
      // The axe: its handle leaning out to the right, its head in the wood.
      g.rect(1, -10, 2, 2).fill(muted(discovered, DB32.lightSteel, DB32.heather));
      g.rect(3, -11, 1, 1).fill(muted(discovered, DB32.pancho));
      g.rect(4, -12, 1, 1).fill(muted(discovered, DB32.pancho));
      g.rect(5, -13, 1, 1).fill(muted(discovered, DB32.pancho));
      g.rect(6, -14, 1, 1).fill(muted(discovered, DB32.twine));
    },
    drawSketch(g) {
      g.rect(-18, -4, 36, 22).fill(DB32.oiledCedar);
      g.rect(-24, 12, 48, 6).fill(DB32.oiledCedar);
      g.rect(-18, -10, 36, 8).fill(DB32.twine);
      for (const [w, c] of [
        [28, DB32.rope],
        [18, DB32.twine],
        [8, DB32.rope],
      ] as const) {
        g.rect(-w / 2, -8, w, 2).fill(c);
      }
      g.rect(2, -16, 10, 8).fill(DB32.lightSteel).rect(2, -16, 10, 2).fill(DB32.white);
      for (let i = 0; i < 12; i++) g.rect(10 + i * 1.5, -18 - i * 1.5, 3, 3).fill(DB32.pancho);
    },
  },

  // 14) Weathervane — on the ridge of the mill roof (row 12).
  {
    id: 'weathervane',
    ...at(80, 12),
    name: 'Weathervane',
    description:
      "A tin cockerel on the mill's roof, pointing at a wind that is not blowing. Whichever way the weather " +
      'comes from, it has rusted fast facing the cliff.',
    drawBody(g, discovered) {
      const iron = muted(discovered, DB32.dimGray);
      const tin = muted(discovered, DB32.tahitiGold);
      const tinHi = muted(discovered, DB32.goldenFizz, DB32.heather);
      g.rect(-1, -16, 1, 16).fill(iron);
      // The compass arms.
      g.rect(-5, -7, 10, 1).fill(iron);
      g.rect(-6, -8, 1, 3).fill(iron);
      g.rect(5, -8, 1, 3).fill(iron);
      // The cockerel: body, tail, head and comb.
      g.rect(-3, -20, 6, 4).fill(tin);
      g.rect(-3, -20, 6, 1).fill(tinHi);
      g.rect(-5, -23, 2, 5).fill(tin);
      g.rect(2, -23, 2, 3).fill(tin);
      g.rect(3, -24, 1, 1).fill(muted(discovered, DB32.clairvoyant));
      g.rect(4, -22, 1, 1).fill(muted(discovered, DB32.goldenFizz, DB32.heather));
    },
    drawSketch(g) {
      g.rect(-1, -10, 3, 30).fill(DB32.dimGray);
      g.rect(-18, 6, 36, 2).fill(DB32.dimGray);
      g.rect(-22, 2, 4, 10).fill(DB32.dimGray);
      g.rect(18, 2, 4, 10).fill(DB32.dimGray);
      g.rect(-12, -24, 22, 14).fill(DB32.tahitiGold);
      g.rect(-12, -24, 22, 2).fill(DB32.goldenFizz);
      g.rect(-20, -34, 8, 18).fill(DB32.tahitiGold);
      g.rect(6, -34, 8, 10).fill(DB32.tahitiGold);
      g.rect(8, -38, 6, 4).fill(DB32.clairvoyant);
      g.rect(14, -30, 4, 2).fill(DB32.goldenFizz);
      g.rect(-8, -16, 4, 2).fill(DB32.rope);
    },
  },

  // 18) Scarecrow — in the wheat field, by the first hay bale.
  {
    id: 'scarecrow',
    ...at(107, 20),
    name: 'Scarecrow',
    description:
      'A sack for a head, a coat too good to throw away, and straw coming out at every seam. The crows sit on ' +
      'its arms. Its stitched mouth is a spiral.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const post = muted(discovered, DB32.oiledCedar);
      const coat = muted(discovered, DB32.venice);
      const straw = muted(discovered, DB32.twine, DB32.heather);
      const sack = muted(discovered, DB32.pancho, DB32.heather);
      g.rect(-1, -14, 2, 14).fill(post);
      // Arms: the crossbar, with straw hands.
      g.rect(-8, -16, 16, 2).fill(post);
      g.rect(-9, -16, 1, 3).fill(straw);
      g.rect(8, -16, 1, 3).fill(straw);
      // The coat.
      g.rect(-4, -17, 8, 9).fill(coat);
      g.rect(-4, -17, 1, 9).fill(ink);
      g.rect(3, -17, 1, 9).fill(ink);
      g.rect(-3, -8, 1, 2).fill(straw);
      g.rect(2, -8, 1, 2).fill(straw);
      // The head and its hat.
      g.rect(-3, -22, 6, 5).fill(sack);
      g.rect(-2, -20, 1, 1).fill(ink);
      g.rect(1, -20, 1, 1).fill(ink);
      g.rect(-1, -18, 2, 1).fill(ink);
      g.rect(-5, -23, 10, 1).fill(muted(discovered, DB32.rope));
      g.rect(-3, -26, 6, 3).fill(muted(discovered, DB32.rope));
    },
    drawSketch(g) {
      g.rect(-2, -4, 4, 24).fill(DB32.oiledCedar);
      g.rect(-26, -8, 52, 4).fill(DB32.oiledCedar);
      g.rect(-12, -10, 24, 22).fill(DB32.venice);
      g.rect(-12, -10, 24, 2).fill(DB32.cornflower);
      g.rect(-30, -8, 4, 8).fill(DB32.twine);
      g.rect(26, -8, 4, 8).fill(DB32.twine);
      g.rect(-10, -26, 20, 16).fill(DB32.pancho);
      g.rect(-6, -22, 3, 3).fill(DB32.valhalla);
      g.rect(3, -22, 3, 3).fill(DB32.valhalla);
      // The stitched spiral mouth.
      g.rect(-3, -16, 7, 1).fill(DB32.valhalla);
      g.rect(3, -16, 1, 3).fill(DB32.valhalla);
      g.rect(-1, -14, 5, 1).fill(DB32.valhalla);
      g.rect(-16, -28, 32, 3).fill(DB32.rope);
      g.rect(-8, -36, 16, 8).fill(DB32.rope);
    },
  },

  // 19) Owl's Roost — on the hay loft, reached off a pushed bale; the owl
  //     itself sits at the loft's west end.
  {
    id: 'owls-roost',
    ...at(113, 16),
    name: "Owl's Roost",
    description:
      'A hollow in the loft hay, lined with down. Under it, a neat little pile of pellets: everything the field ' +
      'has lost at night, rolled up in fur.',
    drawBody(g, discovered) {
      const hay = muted(discovered, DB32.twine);
      const hayHi = muted(discovered, DB32.pancho, DB32.heather);
      const down = muted(discovered, DB32.lightSteel, DB32.heather);
      g.rect(-7, -4, 14, 4).fill(hay);
      g.rect(-6, -5, 12, 1).fill(hayHi);
      g.rect(-4, -4, 8, 2).fill(muted(discovered, DB32.rope));
      g.rect(-3, -4, 6, 1).fill(down);
      // A feather standing up out of the hay.
      g.rect(5, -10, 1, 6).fill(muted(discovered, DB32.white, DB32.heather));
      g.rect(4, -9, 1, 3).fill(down);
      // Pellets.
      g.rect(-7, -6, 2, 2).fill(muted(discovered, DB32.topaz));
      g.rect(-4, -6, 2, 1).fill(muted(discovered, DB32.topaz));
    },
    drawSketch(g) {
      g.rect(-28, 4, 56, 14).fill(DB32.twine);
      g.rect(-26, 0, 52, 4).fill(DB32.pancho);
      g.rect(-16, 2, 32, 8).fill(DB32.rope);
      g.rect(-12, 2, 24, 4).fill(DB32.lightSteel);
      g.rect(14, -22, 3, 24).fill(DB32.white);
      g.rect(10, -18, 4, 12).fill(DB32.lightSteel);
      g.rect(17, -16, 4, 10).fill(DB32.lightSteel);
      for (const [px, py] of [
        [-26, -6],
        [-20, -4],
        [-23, -10],
      ] as const) {
        g.rect(px, py, 6, 4).fill(DB32.topaz).rect(px, py, 6, 1).fill(DB32.heather);
      }
    },
  },

  // 27) Old Nest — on the ledge halfway up the cliff's chimney (row 14).
  {
    id: 'old-nest',
    ...at(159, 14),
    name: 'Old Nest',
    description:
      'Woven into a crack in the chimney, out of the wind: a nest as wide as an arm is long. Two eggs, cold ' +
      'for longer than anyone can say, and too heavy for their size.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const twig = muted(discovered, DB32.rope);
      const twigDark = muted(discovered, DB32.oiledCedar);
      const egg = muted(discovered, DB32.lightSteel, DB32.heather);
      g.rect(-8, -4, 16, 4).fill(twig);
      g.rect(-7, -5, 14, 1).fill(twig);
      for (const tx of [-7, -3, 1, 5]) g.rect(tx, -3, 2, 1).fill(twigDark);
      g.rect(-9, -4, 1, 1).fill(twigDark);
      g.rect(8, -5, 1, 1).fill(twigDark);
      // Two eggs, speckled.
      g.rect(-4, -8, 3, 4).fill(egg);
      g.rect(1, -7, 3, 3).fill(egg);
      g.rect(-3, -7, 1, 1).fill(ink);
      g.rect(2, -6, 1, 1).fill(ink);
    },
    drawSketch(g) {
      g.rect(-30, 2, 60, 14).fill(DB32.rope);
      g.rect(-26, -2, 52, 4).fill(DB32.rope);
      for (let i = 0; i < 8; i++) g.rect(-28 + i * 7, 6 + (i % 2) * 4, 6, 2).fill(DB32.oiledCedar);
      g.rect(-14, -18, 12, 18).fill(DB32.lightSteel).rect(-14, -18, 12, 2).fill(DB32.white);
      g.rect(2, -14, 12, 14).fill(DB32.lightSteel).rect(2, -14, 12, 2).fill(DB32.white);
      for (const [sx, sy] of [
        [-10, -12],
        [-6, -6],
        [6, -8],
        [10, -4],
      ] as const) {
        g.rect(sx, sy, 2, 2).fill(DB32.topaz);
      }
    },
  },

  // 31) Hare's Larder — the secret under the Burrows, through the one-tile
  //     hole in the first gallery's floor (col 12). Two tiles of headroom.
  {
    id: 'hares-larder',
    ...at(12, 33),
    name: "Hare's Larder",
    description:
      'Carrots, a turnip, a heap of seed heads, all laid out in a row against the wall. Whoever keeps this ' +
      'larder has been keeping it for a long, hungry winter.',
    drawBody(g, discovered) {
      const carrot = muted(discovered, DB32.tahitiGold);
      const leaf = muted(discovered, DB32.christi, DB32.heather);
      // Three carrots, leaning.
      for (const cx of [-8, -5, -2]) {
        g.rect(cx, -7, 2, 6).fill(carrot);
        g.rect(cx, -1, 1, 1).fill(carrot);
        g.rect(cx, -9, 2, 2).fill(leaf);
      }
      // A turnip.
      g.rect(2, -5, 5, 5).fill(muted(discovered, DB32.lightSteel, DB32.heather));
      g.rect(2, -5, 5, 2).fill(muted(discovered, DB32.mandy));
      g.rect(4, -8, 1, 3).fill(leaf);
      // Seed heads.
      g.rect(8, -3, 2, 3).fill(muted(discovered, DB32.twine));
    },
    drawSketch(g) {
      for (const [cx, lean] of [
        [-24, 0],
        [-16, 2],
        [-8, 4],
      ] as const) {
        g.rect(cx + lean, -14, 6, 30).fill(DB32.tahitiGold);
        g.rect(cx + lean, -14, 2, 30).fill(DB32.twine);
        g.rect(cx + lean - 2, -24, 10, 10).fill(DB32.christi);
      }
      g.rect(4, -4, 20, 20).fill(DB32.lightSteel);
      g.rect(4, -4, 20, 8).fill(DB32.mandy);
      g.rect(12, -16, 4, 12).fill(DB32.christi);
      g.rect(-28, 16, 56, 2).fill(DB32.oiledCedar);
    },
  },

  // 36) Mother Root — on the Root Hall's high platform (row 43, cols
  //     28-32), among the hanging roots.
  {
    id: 'mother-root',
    ...at(30, 43),
    name: 'Mother Root',
    description:
      'Every root in the hall comes back to this one, thick as a barrel and still growing. Its knots run ' +
      'round it in a spiral, the same way the carvings do upstairs.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const root = muted(discovered, DB32.rope);
      const rootHi = muted(discovered, DB32.twine, DB32.heather);
      const rootLo = muted(discovered, DB32.oiledCedar);
      // The root, coming down out of the dark and splaying over the planks.
      g.rect(-3, -24, 6, 22).fill(root);
      g.rect(-3, -24, 2, 22).fill(rootHi);
      g.rect(2, -24, 1, 22).fill(rootLo);
      g.rect(-7, -3, 14, 3).fill(root);
      g.rect(-9, -1, 4, 1).fill(rootLo);
      g.rect(5, -1, 4, 1).fill(rootLo);
      // The knots, a spiral round it.
      for (const [kx, ky] of [
        [-2, -21],
        [0, -16],
        [-2, -11],
        [0, -6],
      ] as const) {
        g.rect(kx, ky, 2, 2).fill(ink);
      }
    },
    drawSketch(g) {
      g.rect(-10, -34, 20, 46).fill(DB32.rope);
      g.rect(-10, -34, 6, 46).fill(DB32.twine);
      g.rect(6, -34, 4, 46).fill(DB32.oiledCedar);
      g.rect(-26, 10, 52, 8).fill(DB32.rope);
      g.rect(-30, 16, 12, 2).fill(DB32.oiledCedar);
      g.rect(18, 16, 12, 2).fill(DB32.oiledCedar);
      for (let i = 0; i < 6; i++) {
        const kx = Math.round(Math.sin(i * 1.2) * 5) - 2;
        g.rect(kx, -30 + i * 7, 5, 4).fill(DB32.valhalla);
      }
    },
  },

  // 48) Forgotten Millstones — on the floor of Millstone Hall, under the
  //     river.
  {
    id: 'forgotten-millstones',
    ...at(72, 57),
    name: 'Forgotten Millstones',
    description:
      'Two millstones, one lying flat and one leaning on it, far too big to have come down the ladder. The mill ' +
      'must have been built around them — or this hall was.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = muted(discovered, DB32.heather);
      const stoneHi = muted(discovered, DB32.lightSteel, DB32.heather);
      // The flat one.
      g.rect(-11, -3, 14, 3).fill(stone);
      g.rect(-11, -3, 14, 1).fill(stoneHi);
      g.rect(-5, -3, 2, 1).fill(ink);
      // The one leaning on it: a disc, its eye, its dressing grooves.
      g.rect(1, -14, 8, 14).fill(stone);
      g.rect(-1, -12, 12, 10).fill(stone);
      g.rect(1, -14, 8, 1).fill(stoneHi);
      g.rect(-1, -12, 1, 10).fill(stoneHi);
      g.rect(4, -8, 2, 2).fill(ink);
      g.rect(2, -11, 1, 2).fill(muted(discovered, DB32.topaz));
      g.rect(7, -5, 1, 2).fill(muted(discovered, DB32.topaz));
    },
    drawSketch(g) {
      g.rect(-30, 10, 36, 8).fill(DB32.heather).rect(-30, 10, 36, 2).fill(DB32.lightSteel);
      g.rect(-2, -26, 24, 44).fill(DB32.heather);
      g.rect(-8, -20, 36, 32).fill(DB32.heather);
      g.rect(-2, -26, 24, 2).fill(DB32.lightSteel);
      g.rect(6, -6, 8, 8).fill(DB32.valhalla);
      for (let i = 0; i < 4; i++) g.rect(-4 + i * 8, -18 + i * 3, 2, 8).fill(DB32.topaz);
    },
  },

  // 51) Wishing Basin — on the floor of the cistern's middle pool, under
  //     the walkway. Reached by diving.
  {
    id: 'wishing-basin',
    ...at(82, 81),
    name: 'Wishing Basin',
    description:
      'A stone basin at the bottom of the cistern, full of coins. Some are older than the keep. None of them ' +
      'has gone green, as if the water were keeping them for someone.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = muted(discovered, DB32.heather);
      const coin = muted(discovered, DB32.goldenFizz, DB32.heather);
      g.rect(-8, -6, 16, 4).fill(stone);
      g.rect(-6, -2, 12, 2).fill(stone);
      g.rect(-8, -6, 16, 1).fill(muted(discovered, DB32.lightSteel, DB32.heather));
      g.rect(-7, -5, 14, 1).fill(ink);
      for (const cx of [-5, -1, 3]) g.rect(cx, -5, 2, 1).fill(coin);
      g.rect(1, -7, 2, 1).fill(coin);
    },
    drawSketch(g) {
      g.rect(-28, -6, 56, 14).fill(DB32.heather);
      g.rect(-20, 8, 40, 10).fill(DB32.heather);
      g.rect(-28, -6, 56, 2).fill(DB32.lightSteel);
      g.rect(-26, -2, 52, 4).fill(DB32.valhalla);
      for (let i = 0; i < 7; i++) g.rect(-22 + i * 7, -4 - (i % 2) * 2, 5, 3).fill(DB32.goldenFizz);
      g.rect(-32, -14, 64, 4).fill(DB32.venice);
    },
  },

  // 55) Ossuary — in the second of the Vaulted Cellars, on its floor.
  {
    id: 'ossuary',
    ...at(130, 52),
    name: 'Ossuary',
    description:
      'Skulls in a niche in the brick, set face out, row on row, tidy as jars in a pantry. Each one has a ' +
      'small spiral scratched over its eye.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const brick = muted(discovered, DB32.dimGray, DB32.opal);
      const bone = muted(discovered, DB32.pancho, DB32.heather);
      // The niche: an arch of brick.
      g.rect(-9, -16, 18, 16).fill(brick);
      g.rect(-7, -13, 14, 13).fill(ink);
      g.rect(-5, -15, 10, 2).fill(ink);
      // Two rows of skulls.
      for (const [sx, sy] of [
        [-6, -5],
        [-1, -5],
        [4, -5],
        [-4, -10],
        [1, -10],
      ] as const) {
        g.rect(sx, sy, 3, 3).fill(bone);
        g.rect(sx, sy + 1, 1, 1).fill(ink);
        g.rect(sx + 2, sy + 1, 1, 1).fill(ink);
      }
    },
    drawSketch(g) {
      g.rect(-28, -30, 56, 48).fill(DB32.dimGray);
      g.rect(-22, -20, 44, 38).fill(DB32.valhalla);
      g.rect(-14, -26, 28, 6).fill(DB32.valhalla);
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 4 - (row % 2); i++) {
          const sx = -18 + i * 10 + (row % 2) * 5;
          const sy = 6 - row * 11;
          g.rect(sx, sy, 8, 8).fill(DB32.pancho);
          g.rect(sx + 1, sy + 3, 2, 2).fill(DB32.valhalla);
          g.rect(sx + 5, sy + 3, 2, 2).fill(DB32.valhalla);
        }
      }
    },
  },

  // 57) Harvester's Tomb — in the harvesters' crypt, the last of the cellars.
  {
    id: 'harvesters-tomb',
    ...at(132, 81),
    name: "Harvester's Tomb",
    description:
      'A stone figure lies on the lid with a sickle on its chest and a sheaf of wheat at its feet. The wheat ' +
      'is real, and fresh, and nobody has been down here in years.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = muted(discovered, DB32.topaz);
      const stoneHi = muted(discovered, DB32.heather);
      const wheat = muted(discovered, DB32.goldenFizz, DB32.heather);
      // The tomb.
      g.rect(-11, -6, 22, 6).fill(stone);
      g.rect(-11, -6, 22, 1).fill(stoneHi);
      g.rect(-11, -6, 1, 6).fill(ink);
      g.rect(10, -6, 1, 6).fill(ink);
      // The figure on the lid, head to the left.
      g.rect(-9, -8, 15, 2).fill(stoneHi);
      g.rect(-10, -9, 3, 3).fill(stoneHi);
      // The sickle on its chest.
      g.rect(-4, -10, 3, 1).fill(muted(discovered, DB32.lightSteel, DB32.heather));
      g.rect(-2, -11, 1, 1).fill(muted(discovered, DB32.lightSteel, DB32.heather));
      // The sheaf at its feet.
      g.rect(7, -11, 3, 5).fill(wheat);
      g.rect(7, -9, 3, 1).fill(muted(discovered, DB32.rope));
    },
    drawSketch(g) {
      g.rect(-32, 0, 64, 18).fill(DB32.topaz);
      g.rect(-32, 0, 64, 2).fill(DB32.heather);
      g.rect(-26, -8, 44, 8).fill(DB32.heather);
      g.rect(-30, -12, 10, 10).fill(DB32.heather);
      g.rect(-14, -14, 10, 3).fill(DB32.lightSteel);
      g.rect(-6, -18, 3, 4).fill(DB32.lightSteel);
      g.rect(20, -20, 10, 20).fill(DB32.goldenFizz);
      g.rect(20, -12, 10, 3).fill(DB32.rope);
      // The spiral cut into the tomb's side.
      g.rect(-6, 6, 12, 2).fill(DB32.dimGray);
      g.rect(4, 6, 2, 8).fill(DB32.dimGray);
      g.rect(-2, 12, 8, 2).fill(DB32.dimGray);
      g.rect(-2, 9, 2, 5).fill(DB32.dimGray);
    },
  },

  // 61) Geode — on the floor of the crystal gallery, in the Heart of the
  //     Cliff.
  {
    id: 'geode',
    ...at(186, 35),
    name: 'Geode',
    description:
      'A plain grey stone, split clean in two. Inside it is a room of violet crystal, every point of it ' +
      'turned towards the middle.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const shell = muted(discovered, DB32.topaz);
      const crystal = muted(discovered, DB32.mandy, DB32.heather);
      const crystalDark = muted(discovered, DB32.smokeyAsh);
      // Two halves, open.
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -10 : 1;
        g.rect(x0, -9, 9, 9).fill(shell);
        g.rect(x0 + (side < 0 ? 2 : 1), -7, 6, 6).fill(crystalDark);
        g.rect(x0 + (side < 0 ? 3 : 2), -6, 4, 4).fill(crystal);
        g.rect(x0 + (side < 0 ? 4 : 3), -5, 2, 2).fill(muted(discovered, DB32.white, DB32.heather));
      }
      g.rect(-10, -9, 9, 1).fill(muted(discovered, DB32.heather));
      g.rect(1, -9, 9, 1).fill(muted(discovered, DB32.heather));
      g.rect(-1, -9, 2, 9).fill(ink);
    },
    drawSketch(g) {
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -30 : 2;
        g.rect(x0, -24, 28, 40).fill(DB32.topaz).rect(x0, -24, 28, 2).fill(DB32.heather);
        g.rect(x0 + 4, -18, 20, 28).fill(DB32.smokeyAsh);
        for (let i = 0; i < 5; i++) g.rect(x0 + 6 + i * 3, -14 + (i % 2) * 6, 4, 16).fill(DB32.mandy);
        g.rect(x0 + 12, -6, 4, 4).fill(DB32.white);
      }
    },
  },

  // 63) Crystal Lake — on the floor of the lake under the crystal gallery.
  //     Reached by diving.
  {
    id: 'crystal-lake',
    ...at(186, 59),
    name: 'Crystal Lake',
    description:
      'At the bottom of the lake, crystal grows the way weed would: tall, pale, leaning with a current that is ' +
      'not there. The water is lit from below.',
    drawBody(g, discovered) {
      const light = muted(discovered, DB32.viking, DB32.heather);
      const mid = muted(discovered, DB32.cornflower);
      const hi = muted(discovered, DB32.white, DB32.heather);
      g.rect(-8, -2, 16, 2).fill(muted(discovered, DB32.topaz));
      for (const [cx, h] of [
        [-6, 9],
        [-2, 15],
        [2, 11],
        [5, 7],
      ] as const) {
        g.rect(cx, -h, 3, h - 2).fill(mid);
        g.rect(cx, -h, 2, h - 2).fill(light);
        g.rect(cx, -h, 1, 2).fill(hi);
      }
    },
    drawSketch(g) {
      g.rect(-32, -34, 64, 52).fill(DB32.venice);
      g.rect(-30, 12, 60, 6).fill(DB32.topaz);
      for (const [cx, h] of [
        [-20, 26],
        [-8, 42],
        [4, 32],
        [14, 22],
      ] as const) {
        g.rect(cx, 12 - h, 9, h).fill(DB32.cornflower);
        g.rect(cx, 12 - h, 6, h).fill(DB32.viking);
        g.rect(cx, 12 - h, 3, 5).fill(DB32.white);
      }
    },
  },

  // 66) Miner's Lantern — in the Great Gallery, where it runs under the
  //     cellars' brick.
  {
    id: 'miners-lantern',
    ...at(150, 89),
    name: "Miner's Lantern",
    description:
      'A pick driven into the floor, and on it a lantern, still burning. The oil in it is fresh. Whoever lit ' +
      'it walks this gallery, and has never once been seen.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const haft = muted(discovered, DB32.rope);
      const iron = muted(discovered, DB32.dimGray);
      g.rect(-1, -12, 2, 12).fill(haft);
      // The pick's head, on the haft's top.
      g.rect(-6, -13, 12, 2).fill(iron);
      g.rect(-7, -12, 1, 2).fill(iron);
      g.rect(6, -12, 1, 2).fill(iron);
      // The lantern, hanging off the head's right arm.
      g.rect(4, -10, 1, 2).fill(iron);
      g.rect(2, -8, 5, 6).fill(ink);
      g.rect(3, -7, 3, 4).fill(muted(discovered, DB32.goldenFizz, DB32.heather));
      g.rect(4, -6, 1, 2).fill(muted(discovered, DB32.white, DB32.heather));
      g.rect(2, -2, 5, 1).fill(iron);
    },
    drawSketch(g) {
      g.rect(-4, -24, 6, 42).fill(DB32.rope);
      g.rect(-28, -28, 56, 6).fill(DB32.dimGray);
      g.rect(-32, -24, 4, 8).fill(DB32.dimGray);
      g.rect(28, -24, 4, 8).fill(DB32.dimGray);
      g.rect(14, -22, 2, 6).fill(DB32.dimGray);
      g.rect(6, -16, 18, 22).fill(DB32.valhalla);
      g.rect(9, -13, 12, 16).fill(DB32.goldenFizz);
      g.rect(13, -9, 4, 8).fill(DB32.white);
      g.rect(6, 6, 18, 3).fill(DB32.dimGray);
    },
  },

  // 67) Bat Hall — on the ledge at the foot of the chasm's upper section,
  //     where the hall cuts across it.
  {
    id: 'bat-hall',
    ...at(164, 69),
    name: 'Bat Hall',
    description:
      'A spur of granite, hung with bats like fruit. They are all facing the same way — towards the crystal — ' +
      'and they all wake up at once.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const rock = muted(discovered, GRANITE, DB32.opal);
      const rockHi = muted(discovered, DB32.topaz);
      const bat = muted(discovered, DB32.loulou, DB32.opal);
      // A spur of rock standing on the ledge, an arm out at the top.
      g.rect(-3, -18, 6, 18).fill(rock);
      g.rect(-3, -18, 1, 18).fill(rockHi);
      g.rect(-9, -18, 18, 3).fill(rock);
      g.rect(-9, -18, 18, 1).fill(rockHi);
      // Three bats hanging from the arm, wrapped in their wings.
      for (const bx of [-8, 4, 7]) {
        g.rect(bx, -15, 2, 4).fill(bat);
        g.rect(bx, -12, 1, 1).fill(ink);
      }
    },
    drawSketch(g) {
      g.rect(-8, -30, 16, 48).fill(GRANITE);
      g.rect(-28, -32, 56, 8).fill(GRANITE);
      g.rect(-28, -32, 56, 2).fill(DB32.topaz);
      for (const bx of [-24, -14, 12, 22]) {
        g.rect(bx, -24, 6, 12).fill(DB32.loulou);
        g.rect(bx - 2, -22, 2, 6).fill(DB32.loulou);
        g.rect(bx + 6, -22, 2, 6).fill(DB32.loulou);
        g.rect(bx + 2, -14, 2, 2).fill(DB32.goldenFizz);
      }
    },
  },
];
