import { DB32, TILE_SIZE } from '@constants';
import { drawGlow } from '@entities/glow';
import type { LandmarkSpec } from '@entities/landmark';

// The Old Keep's landmarks: the four the hall has always had, moved with it
// to (+70, +30), and the nine the v2 handoff adds around it. Each stands
// where its marker is on the handoff's map
// (design_handoff_level_03_old_keep_v2/level-03-old-keep-v2-markers.json):
// x is the middle of the marker's column, y the top of the tile it stands on.

// A landmark's base at the middle of a column, on a row's top edge.
const at = (col: number, row: number) => ({ x: col * TILE_SIZE + 8, y: row * TILE_SIZE });

const inkFor = (discovered: boolean): number => (discovered ? DB32.opal : DB32.valhalla);

// A tone, or the grey it fades to once the landmark is in the book.
const muted = (discovered: boolean, live: number, logged: number = DB32.dimGray): number =>
  discovered ? logged : live;

export const OLD_KEEP_LANDMARKS: LandmarkSpec[] = [
  // Stone Throne — centred on the hall's UPPER floor (col 84). The throne is the
  // climb's reward: player has to find the staircase on the right side and
  // ascend four steps to reach this room.
  {
    id: 'stone-throne',
    ...at(84, 38),
    name: 'Stone Throne',
    description:
      'A throne carved from a single block of dark stone. The seat is worn smooth in the shape of someone ' +
      'who sat here often, long ago. The back is engraved with a spiral motif you have seen before — ' +
      'on the Stone Marker.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const stoneShadow = discovered ? DB32.opal : DB32.dimGray;
      const accent = discovered ? DB32.heather : DB32.goldenFizz;

      // Base — 16 wide × 4 tall slab.
      g.rect(-8, -4, 16, 4).fill(stone);
      g.rect(-8, -4, 16, 1).fill(stoneHi);
      g.rect(-8, -4, 1, 4).fill(ink);
      g.rect(7, -4, 1, 4).fill(ink);
      g.rect(-8, -1, 16, 1).fill(ink);

      // Seat block — 12 wide × 4 tall sitting on the base.
      g.rect(-6, -8, 12, 4).fill(stone);
      g.rect(-6, -8, 12, 1).fill(stoneHi);
      g.rect(-6, -8, 1, 4).fill(ink);
      g.rect(5, -8, 1, 4).fill(ink);
      g.rect(-6, -5, 12, 1).fill(stoneShadow);

      // Backrest — 12 wide × 12 tall rising from the seat.
      g.rect(-6, -20, 12, 12).fill(stone);
      g.rect(-6, -20, 12, 1).fill(stoneHi);
      g.rect(-6, -20, 1, 12).fill(ink);
      g.rect(5, -20, 1, 12).fill(ink);

      // Spiral motif carved into the backrest centre. Three short lines
      // at increasing depth — reads as a coiled glyph.
      g.rect(-3, -16, 6, 1).fill(ink);
      g.rect(-3, -16, 1, 4).fill(ink);
      g.rect(2, -16, 1, 4).fill(ink);
      g.rect(-3, -13, 6, 1).fill(ink);
      g.rect(-1, -15, 1, 2).fill(ink);

      // Finial — small carved cap on top of the backrest.
      g.rect(-4, -22, 8, 2).fill(stone);
      g.rect(-4, -22, 8, 1).fill(stoneHi);
      g.rect(-1, -24, 2, 2).fill(accent);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      const accent = DB32.goldenFizz;

      // Base.
      g.rect(-20, 16, 40, 6).fill(stone);
      g.rect(-20, 16, 40, 1).fill(stoneHi);
      // Seat.
      g.rect(-16, 8, 32, 8).fill(stone);
      g.rect(-16, 8, 32, 1).fill(stoneHi);
      // Backrest.
      g.rect(-16, -24, 32, 32).fill(stone);
      g.rect(-16, -24, 32, 1).fill(stoneHi);
      // Spiral.
      g.rect(-8, -16, 16, 1).fill(ink);
      g.rect(-8, -16, 1, 8).fill(ink);
      g.rect(7, -16, 1, 8).fill(ink);
      g.rect(-8, -8, 16, 1).fill(ink);
      g.rect(-3, -14, 1, 6).fill(ink);
      g.rect(2, -14, 1, 4).fill(ink);
      // Finial.
      g.rect(-10, -28, 20, 4).fill(stoneHi);
      g.rect(-3, -32, 6, 4).fill(accent);
    },
  },

  // Masons' Niche — at the far west end of the hidden passage between the
  // floors (rows 42-43, col 73). The only way in is the two-tile jump west
  // off the landing, so finding it is the whole reward. Kept under 24 px
  // tall: the passage is two tiles high.
  {
    id: 'masons-niche',
    ...at(73, 44),
    name: "Masons' Niche",
    description:
      'A low gap between the floors, left on purpose. At its end someone scratched a spiral into the mortar ' +
      'and, beside it, a long row of tally marks — days, or steps, or names. ' +
      'The dust here has not been disturbed in a very long time.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const stone = discovered ? DB32.dimGray : DB32.heather;
      const stoneHi = discovered ? DB32.dimGray : DB32.lightSteel;
      const tool = discovered ? DB32.opal : DB32.rope;

      // A loose block of dressed stone, left where it was cut.
      g.rect(-7, -6, 10, 6).fill(stone);
      g.rect(-7, -6, 10, 1).fill(stoneHi);
      g.rect(-7, -6, 1, 6).fill(ink);
      g.rect(2, -6, 1, 6).fill(ink);
      g.rect(-7, -1, 10, 1).fill(ink);
      // The spiral scratched into its face.
      g.rect(-5, -4, 4, 1).fill(ink);
      g.rect(-5, -4, 1, 2).fill(ink);
      g.rect(-2, -4, 1, 2).fill(ink);
      g.rect(-4, -2, 3, 1).fill(ink);
      // Tally marks on the wall behind it.
      for (let i = 0; i < 4; i++) {
        g.rect(-6 + i * 2, -12, 1, 4).fill(ink);
      }
      g.rect(-7, -10, 8, 1).fill(ink);
      // A mason's chisel leaning against the block.
      g.rect(4, -7, 1, 7).fill(tool);
      g.rect(4, -8, 1, 1).fill(stoneHi);
    },
    drawSketch(g) {
      const stone = DB32.heather;
      const stoneHi = DB32.lightSteel;
      const ink = DB32.valhalla;
      // Block.
      g.rect(-24, -2, 34, 22).fill(stone);
      g.rect(-24, -2, 34, 2).fill(stoneHi);
      // Spiral.
      g.rect(-17, 4, 16, 1).fill(ink);
      g.rect(-17, 4, 1, 10).fill(ink);
      g.rect(-2, 4, 1, 10).fill(ink);
      g.rect(-17, 14, 16, 1).fill(ink);
      g.rect(-12, 8, 6, 1).fill(ink);
      g.rect(-12, 8, 1, 4).fill(ink);
      // Tallies — four strokes and a fifth across them, three times over.
      for (let set = 0; set < 3; set++) {
        for (let i = 0; i < 4; i++) {
          g.rect(-24 + set * 16 + i * 3, -24, 1, 14).fill(ink);
        }
        g.rect(-25 + set * 16, -17, 12, 1).fill(ink);
      }
      // Chisel.
      g.rect(16, -6, 3, 26).fill(DB32.rope);
      g.rect(16, -10, 3, 4).fill(stoneHi);
    },
  },

  // Stained Glass — on the hall's high east ledge (row 37, col 124), the far end of
  // the climb past the staircase. The window stands against the back wall
  // with nothing but stone behind it.
  {
    id: 'stained-glass',
    ...at(124, 37),
    name: 'Stained Glass',
    description:
      'A window of coloured glass, set high where no one would think to look. There is no daylight behind it, ' +
      'only stone — and still the glass glows faintly. At its heart, picked out in gold: the spiral.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const frame = discovered ? DB32.dimGray : DB32.heather;
      const blue = discovered ? DB32.opal : DB32.cornflower;
      const red = discovered ? DB32.dimGray : DB32.clairvoyant;
      const green = discovered ? DB32.opal : DB32.eltGreen;
      const gold = discovered ? DB32.heather : DB32.goldenFizz;

      // Sill.
      g.rect(-8, -2, 16, 2).fill(frame);
      g.rect(-8, -2, 16, 1).fill(ink);
      // Pointed-arch frame, 12 wide × 26 tall.
      g.rect(-6, -24, 12, 22).fill(frame);
      g.rect(-4, -26, 8, 2).fill(frame);
      g.rect(-2, -28, 4, 2).fill(frame);
      // Glass panes inside the frame, in bands.
      g.rect(-4, -22, 8, 6).fill(blue);
      g.rect(-4, -16, 8, 6).fill(red);
      g.rect(-4, -10, 8, 6).fill(green);
      g.rect(-2, -25, 4, 3).fill(blue);
      // Lead lines.
      g.rect(0, -25, 1, 21).fill(ink);
      g.rect(-4, -16, 8, 1).fill(ink);
      g.rect(-4, -10, 8, 1).fill(ink);
      // The gold spiral at the centre.
      g.rect(-2, -15, 4, 1).fill(gold);
      g.rect(-2, -15, 1, 3).fill(gold);
      g.rect(1, -15, 1, 3).fill(gold);
      g.rect(-1, -13, 2, 1).fill(gold);
    },
    drawSketch(g) {
      const frame = DB32.heather;
      const ink = DB32.valhalla;
      const gold = DB32.goldenFizz;
      // Frame and arch.
      g.rect(-18, -20, 36, 40).fill(frame);
      g.rect(-12, -28, 24, 8).fill(frame);
      g.rect(-6, -34, 12, 6).fill(frame);
      // Panes.
      g.rect(-14, -18, 28, 12).fill(DB32.cornflower);
      g.rect(-14, -6, 28, 12).fill(DB32.clairvoyant);
      g.rect(-14, 6, 28, 12).fill(DB32.eltGreen);
      g.rect(-8, -28, 16, 10).fill(DB32.royalBlue);
      // Lead.
      g.rect(-1, -28, 2, 46).fill(ink);
      g.rect(-14, -6, 28, 1).fill(ink);
      g.rect(-14, 6, 28, 1).fill(ink);
      // Spiral in gold leaf over the centre.
      g.rect(-8, -4, 16, 2).fill(gold);
      g.rect(-8, -4, 2, 9).fill(gold);
      g.rect(6, -4, 2, 9).fill(gold);
      g.rect(-8, 4, 16, 2).fill(gold);
      g.rect(-3, 0, 6, 2).fill(gold);
    },
  },

  // Great Kettle — on the hall's lower floor (col 99), past the garden door,
  // under the passage floor.
  {
    id: 'great-kettle',
    ...at(99, 48),
    name: 'Great Kettle',
    description:
      'An iron kettle big enough to bathe in, cold for longer than anyone can say. Something has dried in a ring ' +
      'around the inside — soup, or dye, or ink. The ladle still hangs on the rim, as if the cook only stepped out.',
    drawBody(g, discovered) {
      const ink = inkFor(discovered);
      const iron = discovered ? DB32.opal : DB32.verdigris;
      const ironHi = discovered ? DB32.dimGray : DB32.topaz;
      const wood = discovered ? DB32.dimGray : DB32.rope;

      // Three stubby legs.
      g.rect(-6, -2, 2, 2).fill(iron);
      g.rect(-1, -2, 2, 2).fill(iron);
      g.rect(4, -2, 2, 2).fill(iron);
      // Pot body — 14 wide, rounded by trimming the corners.
      g.rect(-7, -10, 14, 8).fill(iron);
      g.rect(-6, -11, 12, 1).fill(iron);
      g.rect(-6, -2, 12, 1).fill(ink);
      g.rect(-7, -10, 1, 7).fill(ink);
      g.rect(6, -10, 1, 7).fill(ink);
      g.rect(-5, -9, 3, 1).fill(ironHi);
      // Rim.
      g.rect(-8, -12, 16, 2).fill(ironHi);
      g.rect(-8, -12, 16, 1).fill(ink);
      // Ladle hooked over the rim, handle up and out.
      g.rect(5, -17, 1, 6).fill(wood);
      g.rect(6, -18, 1, 2).fill(wood);
    },
    drawSketch(g) {
      const iron = DB32.verdigris;
      const ironHi = DB32.topaz;
      const ink = DB32.valhalla;
      // Legs.
      g.rect(-18, 14, 5, 8).fill(iron);
      g.rect(-2, 14, 5, 8).fill(iron);
      g.rect(13, 14, 5, 8).fill(iron);
      // Body.
      g.rect(-22, -8, 44, 24).fill(iron);
      g.rect(-18, -12, 36, 4).fill(iron);
      g.rect(-18, 14, 36, 2).fill(ink);
      g.rect(-16, -4, 8, 2).fill(ironHi);
      // Rim, with the dried ring just under it.
      g.rect(-24, -16, 48, 5).fill(ironHi);
      g.rect(-24, -16, 48, 1).fill(ink);
      g.rect(-20, -10, 40, 1).fill(DB32.oiledCedar);
      // Ladle.
      g.rect(14, -34, 3, 20).fill(DB32.rope);
      g.rect(16, -38, 3, 5).fill(DB32.rope);
    },
  },

  // 12) Watchman's Horn — on a peg in the west tower, at the end of the wall
  //     walk.
  {
    id: 'watchmans-horn',
    ...at(8, 12),
    name: "Watchman's Horn",
    description: 'A brass horn on a peg, green with age. Someone polished the mouthpiece, and only the mouthpiece.',
    drawBody(g, discovered) {
      const wood = muted(discovered, DB32.oiledCedar);
      const brass = muted(discovered, DB32.rainforest, DB32.dimGray);
      const green = muted(discovered, DB32.eltGreen, DB32.opal);
      // The post and its peg.
      g.rect(-1, -20, 2, 20).fill(wood);
      g.rect(-1, -20, 1, 20).fill(muted(discovered, DB32.rope));
      g.rect(1, -17, 3, 1).fill(wood);
      // The horn hanging from the peg by its strap, bell down and to the left.
      g.rect(2, -16, 1, 3).fill(muted(discovered, DB32.twine));
      g.rect(-6, -11, 9, 2).fill(brass);
      g.rect(-8, -12, 3, 4).fill(brass);
      g.rect(-9, -13, 2, 6).fill(brass);
      g.rect(-5, -11, 2, 1).fill(green);
      g.rect(0, -10, 2, 1).fill(green);
      g.rect(3, -11, 2, 1).fill(muted(discovered, DB32.goldenFizz, DB32.heather));
      g.rect(-9, -13, 1, 6).fill(inkFor(discovered));
    },
    drawSketch(g) {
      g.rect(-34, -4, 50, 6).fill(DB32.rainforest);
      g.rect(-40, -10, 10, 18).fill(DB32.rainforest);
      g.rect(-44, -14, 6, 26).fill(DB32.rainforest);
      g.rect(-44, -14, 2, 26).fill(DB32.stinger);
      for (const x of [-30, -18, -6, 4]) g.rect(x, -2, 4, 2).fill(DB32.eltGreen);
      g.rect(16, -4, 10, 6).fill(DB32.goldenFizz);
      g.rect(22, -2, 4, 2).fill(DB32.white);
      g.rect(0, -24, 2, 20).fill(DB32.twine);
      g.rect(-6, -28, 16, 4).fill(DB32.oiledCedar);
    },
  },
  // 13) Banner of the Keep — on the centre tower's roof, up its ladder.
  {
    id: 'banner-of-the-keep',
    ...at(100, 2),
    name: 'Banner of the Keep',
    description:
      'Faded to the colour of weak tea. The spiral is still there, stitched in a thread that has not faded at all.',
    drawBody(g, discovered) {
      const cloth = muted(discovered, DB32.twine, DB32.heather);
      const thread = muted(discovered, DB32.goldenFizz, DB32.lightSteel);
      g.rect(-6, -1, 3, 1).fill(DB32.dimGray);
      g.rect(-5, -30, 1, 29).fill(muted(discovered, DB32.rope));
      g.rect(-5, -31, 1, 1).fill(thread);
      g.rect(-4, -29, 11, 12).fill(cloth);
      g.rect(-4, -29, 11, 1).fill(muted(discovered, DB32.pancho, DB32.lightSteel));
      // The swallowtail at its fly end.
      g.rect(7, -29, 2, 5).fill(cloth);
      g.rect(7, -22, 2, 5).fill(cloth);
      // The spiral.
      g.rect(-1, -26, 5, 1).fill(thread);
      g.rect(-1, -26, 1, 5).fill(thread);
      g.rect(3, -26, 1, 4).fill(thread);
      g.rect(1, -22, 3, 1).fill(thread);
      g.rect(1, -24, 1, 2).fill(thread);
    },
    drawSketch(g) {
      g.rect(-30, -34, 3, 60).fill(DB32.rope);
      g.rect(-27, -32, 48, 36).fill(DB32.twine);
      g.rect(21, -32, 10, 14).fill(DB32.twine);
      g.rect(21, -10, 10, 14).fill(DB32.twine);
      g.rect(-27, -32, 48, 2).fill(DB32.pancho);
      g.rect(-14, -24, 20, 2).fill(DB32.goldenFizz);
      g.rect(-14, -24, 2, 20).fill(DB32.goldenFizz);
      g.rect(4, -24, 2, 16).fill(DB32.goldenFizz);
      g.rect(-6, -8, 12, 2).fill(DB32.goldenFizz);
      g.rect(-6, -16, 2, 8).fill(DB32.goldenFizz);
      g.rect(-6, -16, 6, 2).fill(DB32.goldenFizz);
    },
  },
  // 20) Bread Oven — in the kitchens' west wall, past the hearth.
  {
    id: 'bread-oven',
    ...at(12, 48),
    name: 'Bread Oven',
    description:
      'Still warm, somehow. A single loaf-shaped hollow in the ashes, as if the last loaf was taken out this morning.',
    drawBody(g, discovered) {
      const brick = muted(discovered, DB32.topaz);
      const brickHi = muted(discovered, DB32.heather);
      if (!discovered) drawGlow(g, { x: 0, y: -5, radius: 9, color: DB32.tahitiGold });
      // The dome, brick, lit along its top.
      g.rect(-9, -10, 18, 10).fill(brick);
      g.rect(-7, -13, 14, 3).fill(brick);
      g.rect(-4, -15, 8, 2).fill(brick);
      g.rect(-4, -15, 8, 1).fill(brickHi);
      g.rect(-7, -13, 3, 1).fill(brickHi);
      for (const [x, y] of [
        [-6, -8],
        [2, -11],
        [5, -6],
        [-3, -3],
      ] as const) {
        g.rect(x, y, 3, 1).fill(DB32.dimGray);
      }
      // Its mouth, with the ash and the hollow in it.
      g.rect(-4, -7, 8, 7).fill(DB32.black);
      g.rect(-3, -8, 6, 1).fill(DB32.black);
      g.rect(-4, -2, 8, 2).fill(muted(discovered, DB32.dimGray, DB32.opal));
      g.rect(-2, -2, 4, 1).fill(muted(discovered, DB32.loulou, DB32.valhalla));
      g.rect(-1, -4, 2, 1).fill(muted(discovered, DB32.tahitiGold, DB32.dimGray));
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: 8, radius: 24, color: DB32.tahitiGold });
      g.rect(-30, -8, 60, 30).fill(DB32.topaz);
      g.rect(-24, -18, 48, 10).fill(DB32.topaz);
      g.rect(-14, -24, 28, 6).fill(DB32.topaz);
      g.rect(-14, -24, 28, 2).fill(DB32.heather);
      g.rect(-14, 0, 28, 22).fill(DB32.black);
      g.rect(-14, 16, 28, 6).fill(DB32.dimGray);
      g.rect(-8, 16, 16, 3).fill(DB32.loulou);
      g.rect(-4, 10, 8, 2).fill(DB32.tahitiGold);
    },
  },
  // 24) Reliquary — on the chapel's west tribune, reached by the
  //     chandeliers.
  {
    id: 'reliquary',
    ...at(8, 20),
    name: 'Reliquary',
    description:
      'A small silver box on a cushion. Inside, a seed — an ordinary acorn — kept as if it were the most precious ' +
      'thing in the keep.',
    drawBody(g, discovered) {
      const silver = muted(discovered, DB32.lightSteel, DB32.heather);
      if (!discovered) drawGlow(g, { x: 0, y: -6, radius: 8, color: DB32.white });
      g.rect(-6, -3, 12, 3).fill(muted(discovered, DB32.clairvoyant));
      g.rect(-6, -3, 12, 1).fill(muted(discovered, DB32.brown, DB32.heather));
      g.rect(-4, -7, 8, 4).fill(silver);
      g.rect(-4, -7, 8, 1).fill(muted(discovered, DB32.white, DB32.lightSteel));
      g.rect(-4, -4, 8, 1).fill(inkFor(discovered));
      // The lid, open, and the acorn in it.
      g.rect(-5, -12, 1, 5).fill(silver);
      g.rect(-1, -9, 2, 2).fill(muted(discovered, DB32.oiledCedar));
      g.rect(-1, -10, 2, 1).fill(muted(discovered, DB32.rope));
    },
    drawSketch(g) {
      drawGlow(g, { x: 0, y: -4, radius: 28, color: DB32.white });
      g.rect(-28, 10, 56, 10).fill(DB32.clairvoyant);
      g.rect(-28, 10, 56, 3).fill(DB32.brown);
      g.rect(-18, -8, 36, 18).fill(DB32.lightSteel);
      g.rect(-18, -8, 36, 3).fill(DB32.white);
      g.rect(-22, -30, 4, 22).fill(DB32.lightSteel);
      g.rect(-6, -6, 12, 10).fill(DB32.oiledCedar);
      g.rect(-7, -10, 14, 4).fill(DB32.rope);
      g.rect(-1, -13, 2, 3).fill(DB32.oiledCedar);
    },
  },
  // 26) The Cook's Shelf — the larder shelf over the floor, off the larder
  //     well's ladder or a crate pushed under it.
  {
    id: 'cooks-shelf',
    ...at(35, 57),
    name: "The Cook's Shelf",
    description:
      "Jars labelled in a round hand: plum, plum, plum, and one marked 'for the spiral-keeper, when they come back'.",
    drawBody(g, discovered) {
      const glass = muted(discovered, DB32.smokeyAsh);
      const label = muted(discovered, DB32.white, DB32.heather);
      for (const x of [-9, -4, 1]) {
        g.rect(x, -7, 4, 7).fill(glass);
        g.rect(x, -8, 4, 1).fill(muted(discovered, DB32.rope));
        g.rect(x + 1, -5, 2, 2).fill(label);
      }
      g.rect(6, -9, 4, 9).fill(glass);
      g.rect(6, -10, 4, 1).fill(muted(discovered, DB32.rope));
      g.rect(7, -7, 2, 3).fill(muted(discovered, DB32.goldenFizz, DB32.lightSteel));
      g.rect(-9, -7, 1, 7).fill(muted(discovered, DB32.mandy, DB32.heather));
    },
    drawSketch(g) {
      for (const x of [-30, -16, -2]) {
        g.rect(x, -14, 12, 26).fill(DB32.smokeyAsh);
        g.rect(x, -18, 12, 4).fill(DB32.rope);
        g.rect(x + 2, -6, 8, 8).fill(DB32.white);
        g.rect(x, -14, 2, 26).fill(DB32.mandy);
      }
      g.rect(14, -22, 14, 34).fill(DB32.smokeyAsh);
      g.rect(14, -26, 14, 4).fill(DB32.rope);
      g.rect(16, -12, 10, 12).fill(DB32.goldenFizz);
      g.rect(-34, 12, 66, 4).fill(DB32.oiledCedar);
    },
  },
  // 32) Iron Crown — in the treasury, behind its portcullis.
  {
    id: 'iron-crown',
    ...at(185, 48),
    name: 'Iron Crown',
    description: 'Too small for any king. It fits a child, or a very old woman, or perhaps no one ever wore it at all.',
    drawBody(g, discovered) {
      const iron = muted(discovered, DB32.dimGray, DB32.opal);
      const tip = muted(discovered, DB32.heather);
      // The plinth and its cushion.
      g.rect(-5, -5, 10, 5).fill(muted(discovered, DB32.topaz));
      g.rect(-5, -5, 10, 1).fill(tip);
      g.rect(-6, -8, 12, 3).fill(muted(discovered, DB32.deepKoamaru, DB32.valhalla));
      // The crown: a band and three points.
      g.rect(-4, -11, 8, 3).fill(iron);
      for (const x of [-4, -1, 2]) {
        g.rect(x, -13, 2, 2).fill(iron);
        g.rect(x, -14, 1, 1).fill(tip);
      }
      g.rect(-4, -10, 8, 1).fill(tip);
    },
    drawSketch(g) {
      g.rect(-24, 6, 48, 14).fill(DB32.deepKoamaru);
      g.rect(-20, -8, 40, 14).fill(DB32.dimGray);
      g.rect(-20, -8, 40, 2).fill(DB32.heather);
      for (const x of [-20, -6, 8]) {
        g.rect(x, -20, 12, 12).fill(DB32.dimGray);
        g.rect(x + 4, -24, 4, 4).fill(DB32.heather);
      }
      g.rect(-16, -2, 32, 2).fill(DB32.valhalla);
    },
  },
  // 34) Signal Brazier — on the east tower's floor, under its open roof.
  {
    id: 'signal-brazier',
    ...at(188, 12),
    name: 'Signal Brazier',
    description:
      'Cold for years, but stacked ready with dry wood, as if someone meant to light it the night they were needed.',
    drawBody(g, discovered) {
      const iron = muted(discovered, DB32.dimGray, DB32.opal);
      // The tripod.
      g.rect(-6, -6, 2, 6).fill(iron);
      g.rect(4, -6, 2, 6).fill(iron);
      g.rect(-1, -6, 2, 6).fill(iron);
      // The bowl.
      g.rect(-7, -9, 14, 3).fill(iron);
      g.rect(-8, -11, 16, 2).fill(iron);
      g.rect(-8, -11, 16, 1).fill(muted(discovered, DB32.heather));
      // The wood stacked in it.
      for (const [x, y, w] of [
        [-6, -13, 12],
        [-5, -15, 10],
        [-3, -17, 6],
      ] as const) {
        g.rect(x, y, w, 2).fill(muted(discovered, DB32.oiledCedar));
        g.rect(x, y, w, 1).fill(muted(discovered, DB32.rope));
      }
    },
    drawSketch(g) {
      g.rect(-22, 4, 6, 18).fill(DB32.dimGray);
      g.rect(16, 4, 6, 18).fill(DB32.dimGray);
      g.rect(-3, 4, 6, 18).fill(DB32.dimGray);
      g.rect(-28, -6, 56, 10).fill(DB32.dimGray);
      g.rect(-28, -6, 56, 2).fill(DB32.heather);
      for (const [y, w] of [
        [-12, 48],
        [-18, 38],
        [-24, 24],
        [-30, 12],
      ] as const) {
        g.rect(-w / 2, y, w, 6).fill(DB32.oiledCedar);
        g.rect(-w / 2, y, w, 2).fill(DB32.rope);
      }
    },
  },
  // 38) Prisoner's Calendar — in the westmost cell, by its window slit.
  {
    id: 'prisoners-calendar',
    ...at(64, 70),
    name: "Prisoner's Calendar",
    description:
      'Tally marks scratched by the window slit — hundreds of them — and at the end, not a cross but a little ' +
      'drawing of a door, left open.',
    drawBody(g, discovered) {
      const stone = muted(discovered, DB32.heather, DB32.dimGray);
      const ink = inkFor(discovered);
      // A pale slab of the wall, and the slit at its top.
      g.rect(-8, -26, 16, 26).fill(stone);
      g.rect(-1, -24, 2, 6).fill(DB32.black);
      g.rect(-1, -24, 1, 6).fill(muted(discovered, DB32.cornflower, DB32.opal));
      // Rows of tallies.
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 6; i++) g.rect(-7 + i * 2 + (row % 2), -16 + row * 4, 1, 3).fill(ink);
      }
      // The door, drawn open.
      g.rect(2, -5, 4, 5).fill(ink);
      g.rect(3, -4, 2, 4).fill(stone);
      g.rect(6, -5, 1, 5).fill(ink);
    },
    drawSketch(g) {
      g.rect(-32, -34, 64, 60).fill(DB32.heather);
      g.rect(-3, -30, 6, 18).fill(DB32.black);
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < 12; i++) g.rect(-28 + i * 4, -6 + row * 6, 1, 4).fill(DB32.valhalla);
      }
      g.rect(14, 4, 12, 18).fill(DB32.valhalla);
      g.rect(16, 6, 8, 16).fill(DB32.heather);
      g.rect(26, 4, 4, 18).fill(DB32.valhalla);
    },
  },
  // 43) Rat King's Nest — on the sewer walkway, east of the sluice's lever.
  {
    id: 'rat-kings-nest',
    ...at(150, 78),
    name: "Rat King's Nest",
    description:
      'A heap of string, buttons and one tiny crown made from a thimble. The mice who live here are very proud of it.',
    drawBody(g, discovered) {
      const string = muted(discovered, DB32.twine, DB32.heather);
      g.rect(-8, -4, 16, 4).fill(muted(discovered, DB32.rope));
      g.rect(-6, -6, 12, 2).fill(string);
      g.rect(-3, -7, 6, 1).fill(string);
      for (const [x, y, c] of [
        [-6, -3, DB32.brown],
        [-2, -5, DB32.cornflower],
        [3, -3, DB32.goldenFizz],
        [5, -5, DB32.christi],
      ] as const) {
        g.rect(x, y, 2, 2).fill(muted(discovered, c, DB32.dimGray));
      }
      // The thimble crown on top.
      g.rect(-1, -10, 3, 3).fill(muted(discovered, DB32.heather));
      g.rect(-1, -11, 1, 1).fill(muted(discovered, DB32.goldenFizz, DB32.lightSteel));
      g.rect(1, -11, 1, 1).fill(muted(discovered, DB32.goldenFizz, DB32.lightSteel));
    },
    drawSketch(g) {
      g.rect(-34, 4, 68, 16).fill(DB32.rope);
      g.rect(-26, -4, 52, 8).fill(DB32.twine);
      g.rect(-14, -8, 28, 4).fill(DB32.twine);
      for (const [x, y, c] of [
        [-26, 8, DB32.brown],
        [-10, 0, DB32.cornflower],
        [10, 8, DB32.goldenFizz],
        [20, 0, DB32.christi],
      ] as const) {
        g.rect(x, y, 8, 8).fill(c);
        g.rect(x + 3, y + 3, 2, 2).fill(DB32.valhalla);
      }
      g.rect(-6, -26, 12, 18).fill(DB32.heather);
      for (let x = -4; x < 6; x += 3) g.rect(x, -24, 1, 1).fill(DB32.dimGray);
      g.rect(-6, -30, 2, 4).fill(DB32.goldenFizz);
      g.rect(4, -30, 2, 4).fill(DB32.goldenFizz);
    },
  },
];
