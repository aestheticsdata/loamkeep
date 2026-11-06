import { test } from "@e2e/demo/fixture";

import type { GameSnapshot } from "@game";
import type { Page } from "@playwright/test";

/**
 * Loamkeep, end to end — one continuous take, nine chapters, one screen.
 *
 * This file is the storyboard and nothing else: no key mechanics, no video, no timing arithmetic.
 * Those live in `fixture.ts`, `recorder.ts` and `pacing.ts`, so what is left here reads as a shot
 * list and can be reordered by moving blocks around.
 *
 * Four things it never breaks.
 *
 * IT WAITS FOR ARRIVALS, NOT FOR DURATIONS. The five consoles this harness filmed are driven by a
 * pointer, which lands where it is sent. A player is not sent anywhere — a key is held and physics
 * decides when the walk is over, and the same walk is 1.6s on a warm machine and 2.4s on a cold
 * one. Every beat below holds a key until the snapshot `main.ts` exposes says the player is where
 * the next beat needs them (`walkRightTo`, `whenLanded`, `whenInWater`). A take timed in milliseconds
 * desynchronises by the third beat and every jump after it misses.
 *
 * THE ROUTE IS ONE A PLAYER WOULD TAKE. The meadow is ten times the size it was, and the take
 * crosses its forest and its stream and its field on the way to the keep, as a player walking it
 * for the first time would: up two vines into the canopy and back down the branches, over the
 * ravine, through the stream, up the mill wheel, onto the loft off a pushed bale, into the
 * brambles once — the cairn the player last passed puts them back — and over them on the other
 * bale. Every jump in it is followed by a wait that fails loudly rather than film a player stuck
 * against a wall.
 *
 * EVERY COORDINATE COMES FROM THE LEVEL DATA. The numbers below are the ones in
 * `src/world/levels/*.ts`, named here with the tile they come from, never measured off a
 * screenshot. A level edit that moves the pool moves this file, and that is the intended failure:
 * it fails at the wait, by name, instead of filming a wrong picture.
 *
 * IT WRITES ITS OWN SKETCHBOOK PAGES, AND NOTHING ELSE LEAVES THE BROWSER. `loamkeep.sketchbook.v1`
 * in localStorage is the game's only persistence; Playwright's context is cold on every run, so
 * chapter one always opens on an empty landmarks book and the last chapter always finds exactly
 * the pages this take wrote.
 */

/** The dev-only snapshot `main.ts` hangs on the window. Absent in a production build — see `look`. */
declare global {
  interface Window {
    __loamkeep?: () => GameSnapshot;
  }
}

/**
 * How long any one beat may take to arrive.
 *
 * Generous on purpose: the longest walk in the take is about eight seconds of held key, and a
 * software rasteriser under a screencast runs the game slower than a real machine does. Short
 * enough that a beat which will never arrive — a player against a wall, a fall that landed
 * somewhere else — fails while the run is still worth reading.
 */
const ARRIVE = 25_000;

const TILE = 16;

/**
 * The meadow, from `src/world/levels/meadow.ts` and its tilemap, `meadow-rows.ts`.
 *
 * `x` is the player's AABB top-left, which is what the snapshot reports and what a SpawnPoint
 * declares, so every number here is directly comparable to one. The player is 12 wide, so its
 * centre — the thing a landmark's interact range measures — is `x + 6`. A `…Y` is the player's own
 * y standing on that surface: the surface's top, less a tile.
 */
const MEADOW = {
  /** The grass at row 20, the whole of the surface. */
  grassY: 20 * TILE - TILE,
  /** A step short of the hole at cols 5-7, on col 8 — past the starting cairn at col 9, which lights. */
  leftLedge: 8 * TILE + 2,
  /** The first vine, cols 16, rows 12-19: centred on its column, at its foot. */
  firstVine: 16 * TILE + 2,
  /** The branch the first vine climbs to: row 11, cols 17-25. */
  lowBranch: 17 * TILE - 4,
  lowBranchY: 11 * TILE - TILE,
  /** The long vine, col 22, rows 4-10, standing on that branch. */
  longVine: 22 * TILE + 2,
  /** The top of the canopy: the row-3 branch, cols 23-30. */
  topBranch: 23 * TILE - 4,
  topBranchY: 3 * TILE - TILE,
  /** The Ruined Arch on it, col 26. Its centre. */
  ruinedArch: 26 * TILE + 8,
  /** The last of the row-3 branch: walking off it drops onto the row-12 one, and off that to the grass. */
  canopyEnd: 34 * TILE,
  /** The ravine's west lip (col 38), and its far side (col 42). */
  ravineEdge: 38 * TILE + 8,
  ravineFar: 42 * TILE - 10,
  /** The mouth of the Root Shaft, cols 51-52: its west lip (col 50), and its far side (col 53). */
  shaftEdge: 50 * TILE + 4,
  shaftFar: 53 * TILE - 10,
  /** Under the mill wheel: its hub is at col 73, and its paddles come up past this column. */
  wheel: 72 * TILE - 6,
  /** The top of the wheel: a paddle's top at y 224 (the hub at 272, less its 48 px), the rider on it. */
  wheelTopY: 14 * TILE - TILE,
  /**
   * Where the top paddle has carried the rider east enough to jump for the roof: over the top at
   * x 1146 the full arc lands short of it; by here, coming down the far side, it lands on it.
   */
  wheelLeap: 73 * TILE + 2,
  /** The mill roof, row 12, cols 76-84. */
  roof: 76 * TILE - 8,
  roofY: 12 * TILE - TILE,
  /** The weathervane on its ridge, col 80. Its centre. */
  weathervane: 80 * TILE + 8,
  /** Off the roof's east end. */
  roofEnd: 85 * TILE,
  /** The raised ground at row 18, cols 89-96. */
  rise: 89 * TILE - 8,
  riseY: 18 * TILE - TILE,
  /** The field's cairn, col 101: where the brambles send the player back to. */
  fieldCairn: 101 * TILE + 8 + 4,
  /** Against the first bale once it is pushed up to the loft's west post (col 110). */
  firstBale: 108 * TILE + 4,
  baleTopY: 19 * TILE - TILE,
  /** The loft, row 16, cols 110-116. */
  loft: 109 * TILE,
  loftY: 16 * TILE - TILE,
  /** Off the loft's east end, past its post. */
  loftEnd: 117 * TILE - 1,
  /**
   * Behind the second bale, pushed into the brambles (cols 121-123) as far as is safe: the player's
   * right edge two pixels short of col 121, which is all of a bramble the hazard check forgives.
   */
  secondBale: 121 * TILE - 14,
  /** Along the pushed bale's top, short of its far end, to jump from. */
  baleEnd: 121 * TILE + 4,
  /** Past the brambles, on col 124. */
  bramblesFar: 124 * TILE - 2,
  /**
   * The well: a stone of its rim stands over its mouth at col 129, row 19, and stops the walk.
   * Hopped onto, and stepped off its far side, it drops the player down the shaft beside the
   * ladder (col 130) to the cavern floor at its foot, row 30.
   */
  wellRim: 129 * TILE - 12,
  wellRimY: 19 * TILE - TILE,
  wellFloorY: 30 * TILE - TILE,
  /** The keep's door at the foot of the well, col 134. Its centre. */
  keepDoor: 134 * TILE + 8,
} as const;

/**
 * The Old Keep, from `src/world/levels/old-keep.ts`.
 *
 * Three floors stacked, and the two doors are on different ones: the meadow's door lands the
 * player on the lower floor beside the one back out, and the one down to the crypt is a floor
 * below that. The only way between them is the hole in the lower floor at cols 106-107 — so the
 * chapter walks the length of the hall, drops through it onto the plinth beneath, and walks back.
 * The hall sits at (+70, +30) in the castle built round it, so every column here is 70 more and
 * every row 30 more than the hall's own.
 */
const KEEP = {
  /** Where the meadow's door puts the player down: col 75, on the lower floor. */
  spawn: 75 * TILE + 2,
  /** The hole in the lower floor: cols 106-107. Far enough in to be over it. */
  floorHole: 106 * TILE + 4,
  /**
   * The plinth under the hole, row 51 at cols 106-107 — the player's own y, standing on it. The fall
   * through the hole lands here, and the walk left steps off it onto the basement floor.
   */
  plinthY: 51 * TILE - TILE,
  /**
   * The door down to the crypt: col 78, at the foot of the basement's left pillar. The pillar is
   * solid, so the walk left ends against it — centre fourteen pixels from the door's own, inside
   * the sixteen the interact range allows.
   */
  descendDoor: 79 * TILE + 1,
} as const;

/** The crypt, from `src/world/levels/old-keep-crypt.ts`. */
const CRYPT = {
  /** Where the keep's door puts the player down: col 6. */
  spawn: 6 * TILE + 2,
  /** The last tile before the floor's gap at cols 10-11 — where the jump starts. */
  gapEdge: 9 * TILE - 4,
  /**
   * The inscription — the tomb's lid, slid aside onto the floor just past the gap, at cols 12-13.
   * Its centre. The player reads it from the first solid tile past the gap, col 12: centre 198
   * against the lid's 208, ten pixels inside the sixteen the interact range allows.
   */
  inscription: 13 * TILE,
  /** The first solid tile past the gap — where the jump has to land, and where E is pressed. */
  landing: 12 * TILE,
  /** The crypt floor is row 23; a jump that fell into the grave lands on the bier below this. */
  floorY: 23 * TILE - TILE,
} as const;

/** The keys the game reads. `Cursor` has no opinion about them; the game does. */
const KEY = {
  left: "ArrowLeft",
  right: "ArrowRight",
  jump: "Space",
  climb: "ArrowUp",
  dive: "ArrowDown",
  interact: "KeyE",
  back: "Escape",
  confirm: "Enter",
  menuDown: "ArrowDown",
} as const;

/**
 * One reading of the game's state, for an assertion the storyboard makes itself.
 *
 * Every wait below goes through `page.waitForFunction` instead, which is the same probe polled in
 * the page. This one exists for the two places that need the value rather than the edge.
 */
async function look(page: Page): Promise<GameSnapshot> {
  return page.evaluate(() => {
    const probe = window.__loamkeep;
    if (!probe) {
      throw new Error(
        "demo: window.__loamkeep is missing. The take films `pnpm dev` — main.ts only exposes the " +
          "snapshot when import.meta.env.DEV is true, so a production build has nothing to drive.",
      );
    }
    return probe();
  });
}

const whenRightOf = (page: Page, x: number) =>
  page.waitForFunction((limit) => (window.__loamkeep?.().x ?? -Infinity) >= limit, x, { timeout: ARRIVE });

const whenLeftOf = (page: Page, x: number) =>
  page.waitForFunction((limit) => (window.__loamkeep?.().x ?? Infinity) <= limit, x, { timeout: ARRIVE });

/**
 * Arrived at a column, or stopped short of it by something with a greeting to make.
 *
 * One wait rather than a race between two, because a race leaves the loser running and its timeout
 * surfaces later as an unhandled rejection, in a worker that by then is filming something else.
 */
const whenRightOfOrGreeted = (page: Page, x: number) =>
  page.waitForFunction(
    (limit) => {
      const s = window.__loamkeep?.();
      return !!s && (s.x >= limit || s.greetingOpen);
    },
    x,
    { timeout: ARRIVE },
  );

/** Arrived at a column AND settled on the floor of the level the beat expects. */
const whenLanded = (page: Page, x: number, y: number) =>
  page.waitForFunction(
    (at) => {
      const s = window.__loamkeep?.();
      return !!s && s.onGround && s.x >= at.x && s.y >= at.y;
    },
    { x, y },
    { timeout: ARRIVE },
  );

/** Arrived at a column and still on the floor the beat jumped from — not through the hole in it. */
const whenLandedAbove = (page: Page, x: number, y: number) =>
  page.waitForFunction(
    (at) => {
      const s = window.__loamkeep?.();
      return !!s && s.onGround && s.x >= at.x && s.y <= at.y;
    },
    { x, y },
    { timeout: ARRIVE },
  );

/** Feet higher than a line — up a vine, or carried up by the mill wheel. */
const whenAbove = (page: Page, y: number) =>
  page.waitForFunction((limit) => (window.__loamkeep?.().y ?? Infinity) <= limit, y, { timeout: ARRIVE });

/** On the floor within a few pixels of a column: where a respawn puts the player down. */
const whenAt = (page: Page, x: number) =>
  page.waitForFunction(
    (at) => {
      const s = window.__loamkeep?.();
      return !!s && s.onGround && Math.abs(s.x - at) <= 4;
    },
    x,
    { timeout: ARRIVE },
  );

/**
 * Standing on a paddle of the mill wheel: on something, out of the water, and above the grass the
 * wheel turns over. Nothing else in the stream is that high but its stones, which stand at grass
 * level.
 */
const whenRiding = (page: Page) =>
  page.waitForFunction(
    (grassY) => {
      const s = window.__loamkeep?.();
      return !!s && s.onGround && !s.inWater && s.y < grassY - 4;
    },
    MEADOW.grassY,
    { timeout: ARRIVE },
  );

/** Arrived at a column, or caught by a paddle before getting there — one wait, as for a greeting. */
const whenRightOfOrRiding = (page: Page, x: number) =>
  page.waitForFunction(
    (at) => {
      const s = window.__loamkeep?.();
      return !!s && (s.x >= at.x || (s.onGround && !s.inWater && s.y < at.grassY - 4));
    },
    { x, grassY: MEADOW.grassY },
    { timeout: ARRIVE },
  );

/** The wave over the screen for a respawn, going up (true) or gone (false). */
const whenFading = (page: Page, fading: boolean) =>
  page.waitForFunction((want) => window.__loamkeep?.().fading === want, fading, { timeout: ARRIVE });

const whenAirborne = (page: Page) =>
  page.waitForFunction(() => window.__loamkeep?.().onGround === false, undefined, { timeout: ARRIVE });

const whenSketchbook = (page: Page, open: boolean) =>
  page.waitForFunction((want) => window.__loamkeep?.().sketchbookOpen === want, open, { timeout: ARRIVE });

const whenGreeting = (page: Page, open: boolean) =>
  page.waitForFunction((want) => window.__loamkeep?.().greetingOpen === want, open, { timeout: ARRIVE });

const whenLevel = (page: Page, level: string) =>
  page.waitForFunction(
    (want) => {
      const s = window.__loamkeep?.();
      return !!s && s.level === want && !s.fading && s.mode === "playing";
    },
    level,
    { timeout: ARRIVE },
  );

const whenMode = (page: Page, mode: GameSnapshot["mode"]) =>
  page.waitForFunction(
    (want) => {
      const s = window.__loamkeep?.();
      return !!s && s.mode === want && !s.fading;
    },
    mode,
    { timeout: ARRIVE },
  );

test("loamkeep, end to end", async ({ demo }) => {
  const page = demo.page;

  /** Walk until the player is at or past a column, then stop dead — vel.x is input, so it is instant. */
  const walkRightTo = (x: number) => demo.holdWhile(KEY.right, () => whenRightOf(page, x));
  const walkLeftTo = (x: number) => demo.holdWhile(KEY.left, () => whenLeftOf(page, x));

  /**
   * Walk right to a column, stopping to be spoken to on the way.
   *
   * The first time the player touches a creature the game freezes and a parchment says something.
   * A walk that only waited for the far column would wait for ever when that happens: the key is
   * already down when the parchment opens, and closing it reads a fresh press. So the wait ends on
   * the column *or* on the parchment, and a parchment is held long enough to be read, tapped away
   * with the same key that carries the walk on, and the walk goes again.
   *
   * Whether the meeting happens at all is deliberately not decided here: waiting for the greeting
   * outright would fail every take where it never fired, which is the mirror of the bug this
   * replaced. It was written for the pumpkin that hopped the keep's entry hall; that one lives in
   * the kitchen garden now, so on today's route the walk meets no one, and this is the guard that
   * keeps a creature added to the hall later from killing a take.
   */
  const walkRightMeeting = async (x: number): Promise<void> => {
    // A creature greets once and the flag that says so outlives the level, so two parchments on one
    // walk is already surprising. Bounded rather than trusted: the fall-through is the plain walk,
    // which fails with the timeout that names the column instead of looping here for ever.
    for (let met = 0; met < 2; met++) {
      await demo.holdWhile(KEY.right, () => whenRightOfOrGreeted(page, x));
      if (!(await look(page)).greetingOpen) return;
      await demo.dwell(2600);
      await demo.hold(KEY.right, 120);
      await whenGreeting(page, false);
    }
    await walkRightTo(x);
  };

  /**
   * A jump to the right, held through the landing.
   *
   * The jump key is held long enough to reach the full arc rather than tapped — a tap is a hop and
   * this game lets you choose. The walk key stays down for the whole flight, which is what carries
   * the player across; the wait is on landing, not on the key, so a jump that fell short fails here
   * instead of filming a player in a hole.
   */
  const jumpRightTo = async (arrived: () => Promise<unknown>) => {
    await page.keyboard.down(KEY.right);
    await page.keyboard.down(KEY.jump);
    // The full arc: 64 px up, about 58 px across. Released early it is a hop — the game gives you
    // the choice, and every jump in this take but the hops onto the bales needs the whole thing.
    await page.waitForTimeout(500);
    await page.keyboard.up(KEY.jump);
    try {
      await arrived();
    } finally {
      await page.keyboard.up(KEY.right);
    }
    await demo.dwell(400);
  };

  /** Walk either way to a column, to within a few pixels of it. */
  const walkTo = async (x: number) => {
    const at = (await look(page)).x;
    if (at < x - 3) await walkRightTo(x);
    else if (at > x + 3) await walkLeftTo(x);
  };

  /**
   * Up a vine and off its top onto the branch beside it.
   *
   * Up is held on the vine, and Right only once the feet are over the branch: held from the start,
   * it walks the player off the vine's column and lets go of it. Up stays down through the step
   * across, which on the branch, off the vine, is no key at all — the jump fires on a press.
   */
  const climbRightOnto = async (topY: number, x: number) => {
    await page.keyboard.down(KEY.climb);
    try {
      await whenAbove(page, topY - 2);
      await demo.holdWhile(KEY.right, () => whenLandedAbove(page, x, topY));
    } finally {
      await page.keyboard.up(KEY.climb);
    }
  };

  /**
   * A short hop right, onto a bale. Right is let go of the moment the player is over the target —
   * a hop carried on to its landing would take them off the bale's far side.
   */
  const hopRightOnto = async (x: number, y: number) => {
    await page.keyboard.down(KEY.right);
    try {
      // Not `demo.hold`: it waits a beat after letting go, and Right, still down through that beat,
      // carries the hop on past the target.
      await page.keyboard.down(KEY.jump);
      await page.waitForTimeout(130);
      await page.keyboard.up(KEY.jump);
      await whenRightOf(page, x);
    } finally {
      await page.keyboard.up(KEY.right);
    }
    await whenLandedAbove(page, 0, y);
    await demo.dwell(400);
  };

  /**
   * Onto the hay loft: the first bale pushed up against its west post (or walked up to, if that is
   * where it already is), a hop onto it, and a jump up onto the loft.
   */
  const climbLoft = async () => {
    await walkRightTo(MEADOW.firstBale);
    await demo.dwell(500);
    await hopRightOnto(MEADOW.firstBale + 4, MEADOW.baleTopY);
    await jumpRightTo(() => whenLandedAbove(page, MEADOW.loft, MEADOW.loftY));
  };

  await demo.open("/");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The title");
  // The game boots on a painted dawn: seven sky bands, the sun coming up behind the keep, a rabbit
  // on the ground that is the same rabbit the meadow has. Nothing is pressed for a few seconds —
  // the cursor blinks, the sun climbs, and the landmarks entry reads zero because
  // Playwright's browser is cold and the book is the one thing this game keeps. The zero is the
  // take's, not the game's: your own tab has whatever you have found.
  await demo.dwell(4200);
  await demo.press(KEY.confirm);
  await whenMode(page, "playing");
  await demo.dwell(900);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The meadow");
  // A few steps left, past the starting cairn — its lantern lights as the player goes by, and it is
  // where the brambles will send them back to until they pass another — to the ledge over the
  // first hole down. Then a jump on the spot: a held key goes higher than a tap, the rise is
  // lighter than the fall.
  await walkLeftTo(MEADOW.leftLedge);
  await demo.dwell(1100);
  await demo.hold(KEY.jump, 300);
  await demo.dwell(1400);
  await demo.still("the-meadow");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("A first meeting");
  // The rabbit paces this grass at 32 px/s and the player walks at 72, so walking right is enough
  // to meet it. The first time you touch one, the game stops and it says something.
  await demo.holdWhile(KEY.right, () => whenGreeting(page, true));
  await demo.dwell(2600);
  await demo.still("a-first-meeting");
  // Any movement key closes it — the same key that will carry the walk on.
  await demo.hold(KEY.right, 120);
  await whenGreeting(page, false);
  await demo.dwell(700);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The canopy");
  // Up the first vine, onto the branch at its top, along it to the long vine, and up that to the
  // top of the canopy, where the Ruined Arch is. A bird crosses each branch, and the first it
  // touches stops to talk.
  await walkTo(MEADOW.firstVine);
  await demo.dwell(500);
  await climbRightOnto(MEADOW.lowBranchY, MEADOW.lowBranch);
  await demo.dwell(600);
  // A bird stopping the walk near the vine leaves the player wherever the key that closes its
  // greeting carried them — past the vine's column, as often as not. Back onto it, from either side.
  await walkRightMeeting(MEADOW.longVine);
  await walkTo(MEADOW.longVine);
  await demo.dwell(400);
  await climbRightOnto(MEADOW.topBranchY, MEADOW.topBranch);
  await demo.dwell(800);
  await walkRightMeeting(MEADOW.ruinedArch - 6 - 4);
  await demo.dwell(700);
  await demo.press(KEY.interact);
  await whenSketchbook(page, true);
  await demo.dwell(3200);
  await demo.still("the-sketchbook");
  await demo.press(KEY.interact);
  await whenSketchbook(page, false);
  await demo.dwell(600);
  // Down the way a player comes down: off the end of the branch onto the one below it, and off
  // that to the grass.
  await demo.holdWhile(KEY.right, () => whenLanded(page, MEADOW.canopyEnd, MEADOW.grassY));
  await demo.dwell(800);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The mill");
  // Over the ravine and over the mouth of the Root Shaft, past the stream's cairn, into the stream.
  await walkRightTo(MEADOW.ravineEdge);
  await jumpRightTo(() => whenLandedAbove(page, MEADOW.ravineFar, MEADOW.grassY));
  await walkRightTo(MEADOW.shaftEdge);
  await jumpRightTo(() => whenLandedAbove(page, MEADOW.shaftFar, MEADOW.grassY));
  // Swimming with the jump key down pops the player out of the water at every surface, over both
  // stepping stones, until they are under the wheel; there they keep bobbing until a paddle comes
  // up under them on its way round. Its turn is not on the snapshot, so the wait is for the ride.
  await page.keyboard.down(KEY.jump);
  try {
    await demo.holdWhile(KEY.right, () => whenRightOfOrRiding(page, MEADOW.wheel));
    await whenRiding(page);
  } finally {
    await page.keyboard.up(KEY.jump);
  }
  await demo.dwell(900);
  await demo.still("the-mill-wheel");
  // Over the top, a short jump off onto the mill roof, and the weathervane on its ridge.
  await whenAbove(page, MEADOW.wheelTopY + 1);
  await whenRightOf(page, MEADOW.wheelLeap);
  await jumpRightTo(() => whenLandedAbove(page, MEADOW.roof, MEADOW.roofY));
  await walkRightTo(MEADOW.weathervane - 6 - 4);
  await demo.dwell(700);
  await demo.press(KEY.interact);
  await whenSketchbook(page, true);
  await demo.dwell(2600);
  await demo.press(KEY.interact);
  await whenSketchbook(page, false);
  await demo.dwell(500);
  await demo.holdWhile(KEY.right, () => whenLanded(page, MEADOW.roofEnd, MEADOW.grassY));
  await demo.dwell(600);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The field");
  // Up onto the raised ground, down past the field's cairn, and the first hay bale pushed up to the
  // loft's post: the step the loft is too high to reach without.
  await walkRightTo(MEADOW.rise - TILE + 4);
  await jumpRightTo(() => whenLandedAbove(page, MEADOW.rise, MEADOW.riseY));
  await climbLoft();
  await demo.still("the-field");
  // The owl on the loft, then a jump off its east end, too long: into the brambles. The wave goes
  // over, and the player comes out of it at the field's cairn, the last one they passed.
  await walkRightMeeting(MEADOW.loftEnd - TILE);
  await demo.dwell(600);
  await page.keyboard.down(KEY.right);
  try {
    await demo.hold(KEY.jump, 500);
    await whenFading(page, true);
  } finally {
    await page.keyboard.up(KEY.right);
  }
  await whenFading(page, false);
  await whenAt(page, MEADOW.fieldCairn);
  await demo.dwell(1400);
  // Back up the loft — the bale is still where it was pushed — and down its far end on foot.
  await climbLoft();
  await demo.holdWhile(KEY.right, () => whenRightOf(page, MEADOW.loftEnd));
  await whenLanded(page, 0, MEADOW.grassY);
  await demo.dwell(500);
  // The second bale, pushed into the brambles as far as the player can follow it without touching
  // one, is a stepping stone over them.
  await walkRightTo(MEADOW.secondBale);
  await demo.dwell(500);
  await hopRightOnto(MEADOW.secondBale + 4, MEADOW.baleTopY);
  await walkRightTo(MEADOW.baleEnd);
  await jumpRightTo(() => whenLandedAbove(page, MEADOW.bramblesFar, MEADOW.grassY));
  await demo.dwell(600);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The old keep");
  // Down the well, and the keep's door at its foot. E tears the level layer down and builds the
  // keep around the same player, at the spawn its door names.
  await walkRightTo(MEADOW.wellRim);
  await demo.dwell(400);
  await hopRightOnto(MEADOW.wellRim + 6, MEADOW.wellRimY);
  await demo.holdWhile(KEY.right, () => whenAirborne(page));
  await whenLanded(page, 0, MEADOW.wellFloorY);
  await demo.dwell(800);
  await walkRightTo(MEADOW.keepDoor - 6 - 4);
  await demo.dwell(700);
  await demo.press(KEY.interact);
  await whenLevel(page, "old-keep");
  await demo.dwell(1600);
  await demo.still("the-old-keep");
  // Cool grey brick, a polished floor, gold pillars and candles the length of the hall — walked
  // end to end, because the only way down is the hole at the far end of it. The walk is still the
  // meeting kind: the hall is where a creature would stop it.
  await walkRightMeeting(KEEP.floorHole);
  await whenLanded(page, 0, KEEP.plinthY);
  await demo.dwell(1200);
  // Back along the basement to the door under the hall, which stops the walk itself: the pillar
  // beside it is solid.
  await demo.holdWhile(KEY.left, () => whenLeftOf(page, KEEP.descendDoor));
  await demo.dwell(1000);
  await demo.press(KEY.interact);
  await whenLevel(page, "old-keep-crypt");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The crypt");
  // Near-black masonry with two neutral greys mixed outside the palette on purpose, lit by a
  // chandelier and a candelabrum. The floor has an open grave in it; its lid is on the far side.
  await demo.dwell(2200);
  await demo.still("the-crypt");
  await walkRightTo(CRYPT.gapEdge);
  await demo.dwell(800);
  await jumpRightTo(() => whenLandedAbove(page, CRYPT.landing, CRYPT.floorY));
  // Right is held for the whole arc, so the landing slides on past the lid, out of reach of
  // its sixteen pixels. Back onto col 12 — never further, the grave is the tile behind it.
  await demo.holdWhile(KEY.left, () => whenLeftOf(page, CRYPT.landing + 2));
  await demo.dwell(700);
  await demo.press(KEY.interact);
  await whenSketchbook(page, true);
  await demo.dwell(2600);
  await demo.press(KEY.interact);
  await whenSketchbook(page, false);
  await demo.dwell(600);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The sketchbook");
  // Esc fades back to the title, which is now a different screen: the second entry counts the
  // pages, because they are the only progression the game has.
  await demo.press(KEY.back);
  await whenMode(page, "title");
  await demo.dwell(2400);
  await demo.still("the-title");
  // Down past MAP OF THE WORLD to the landmarks book.
  await demo.press(KEY.menuDown);
  await demo.dwell(300);
  await demo.press(KEY.menuDown);
  await demo.dwell(600);
  await demo.press(KEY.confirm);
  await whenSketchbook(page, true);
  await demo.dwell(2000);
  await demo.still("the-gallery");
  // Through the three pages the take wrote, and onto the leaf that ends the book: how many are
  // still blank, never which ones.
  for (const dwell of [2200, 2200, 3000]) {
    await demo.press(KEY.right);
    await demo.dwell(dwell);
  }

  // The take's own closing assertion: the books hold what the run put in them, and the title behind
  // the gallery is counting the same pages. Five at least, across two books — the Ruined Arch, the
  // Weathervane and the crypt's inscription in the landmarks, the rabbit and the owl in the
  // creatures; a bird adds one more if it crossed a branch while the player stood on it.
  const end = await look(page);
  if (end.pagesWritten < 5) {
    throw new Error(`demo: the take wrote ${end.pagesWritten} of ${end.pagesTotal} pages — it should have written 5`);
  }
});
