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
 * THE ROUTE ONLY GOES DOWN. There is no death here and no way back up a shaft, so the take is
 * written the way the meadow is built: walk right off the grass, fall into the cavern, wade the
 * pool, drop down the right-hand steps to the keep's door. Every descent below is a fall the level
 * designed, not a jump that has to land. The two real jumps — out of the pool, across the crypt's
 * floor gap — are both one tile and are both followed by a wait that would fail loudly rather than
 * film a player stuck against a wall.
 *
 * EVERY COORDINATE COMES FROM THE LEVEL DATA. The numbers below are the ones in
 * `src/world/levels/*.ts`, named here with the tile they come from, never measured off a
 * screenshot. A level edit that moves the pool moves this file, and that is the intended failure:
 * it fails at the wait, by name, instead of filming a wrong picture.
 *
 * IT WRITES TWO SKETCHBOOK PAGES, AND NOTHING ELSE LEAVES THE BROWSER. `loamkeep.sketchbook.v1`
 * in localStorage is the game's only persistence; Playwright's context is cold on every run, so
 * chapter one always opens on LANDMARKS (EMPTY) and the last chapter always finds exactly the
 * pages this take wrote.
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
 * The meadow, from `src/world/levels/meadow.ts`.
 *
 * `x` is the player's AABB top-left, which is what the snapshot reports and what a SpawnPoint
 * declares, so every number here is directly comparable to one. The player is 12 wide, so its
 * centre — the thing a landmark's interact range measures — is `x + 6`.
 */
const MEADOW = {
  /** Spawn, centred on the first screen: the grass band at row 8 runs cols 8-19. */
  spawn: 154,
  /** A step short of the left ledge at col 8, close enough to see the gap and the cave under it. */
  leftLedge: 138,
  /** The shelf the first fall lands on, inside the shaft at col 20: row 13's top. */
  shelfY: 13 * TILE - TILE,
  /** The sunken stone, at the bottom of the cavern pool: col 23, row 18. Its centre. */
  sunkenStone: 23 * TILE + 8,
  /** The pool's right shore: water runs cols 14-31 at row 17, stone from col 32. */
  poolExit: 31 * TILE,
  /** Standing on the cavern floor, past the pool — row 17's top, the player's own y. */
  cavernFloorY: 17 * TILE - TILE,
  /** The deep lake's right edge at row 21: water runs cols 43-50, the bank is col 51. */
  deepWater: 50 * TILE,
  /** The keep's door: col 52, row 21. Its centre. */
  keepDoor: 52 * TILE + 8,
  /** The bottom step, where the door stands — row 21's top, the player's own y. */
  doorFloorY: 21 * TILE - TILE,
} as const;

/**
 * The Old Keep, from `src/world/levels/old-keep.ts`.
 *
 * Three floors stacked, and the two doors are on different ones: the meadow's door lands the
 * player on the lower floor beside the one back out, and the one down to the crypt is a floor
 * below that. The only way between them is the hole in the lower floor at cols 36-37 — so the
 * chapter walks the length of the hall, drops through it, and walks back.
 */
const KEEP = {
  /** Where the meadow's door puts the player down: col 5, on the lower floor. */
  spawn: 5 * TILE + 2,
  /** The hole in the lower floor: cols 36-37. Far enough in to be over it. */
  floorHole: 36 * TILE + 4,
  /** The basement floor, row 22 — the player's own y, standing on it. */
  basementY: 22 * TILE - TILE,
  /**
   * The door down to the crypt: col 8, at the foot of the basement's left pillar. The pillar is
   * solid, so the walk left ends against it at x=144 — centre 150, fourteen pixels from the door's
   * own 136, inside the sixteen the interact range allows.
   */
  descendDoor: 9 * TILE + 1,
} as const;

/** The crypt, from `src/world/levels/old-keep-crypt.ts`. */
const CRYPT = {
  /** Where the keep's door puts the player down: col 6. */
  spawn: 6 * TILE + 2,
  /** The last tile before the floor's gap at cols 10-11 — where the jump starts. */
  gapEdge: 9 * TILE - 4,
  /**
   * The inscription, across the gap: col 11. Its centre — and col 11 is the gap's second tile, so
   * the slab hangs over the hole and cannot be stood under. The player reads it from the first
   * solid tile past it, col 12: centre 198 against the slab's 184, fourteen pixels inside the
   * sixteen the interact range allows.
   */
  inscription: 11 * TILE + 8,
  /** The first solid tile past the gap — where the jump has to land, and where E is pressed. */
  landing: 12 * TILE,
  /** The crypt floor is row 23; a jump that fell through the hole lands well below this. */
  floorY: 23 * TILE - TILE,
} as const;

/** The keys the game reads. `Cursor` has no opinion about them; the game does. */
const KEY = {
  left: "ArrowLeft",
  right: "ArrowRight",
  jump: "Space",
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

const whenAirborne = (page: Page) =>
  page.waitForFunction(() => window.__loamkeep?.().onGround === false, undefined, { timeout: ARRIVE });

/** On the floor and out of the water — the pair that says a swim actually ended on a bank. */
const whenOnDryGround = (page: Page) =>
  page.waitForFunction(
    () => {
      const s = window.__loamkeep?.();
      return !!s && s.onGround && !s.inWater;
    },
    undefined,
    { timeout: ARRIVE },
  );

const whenInWater = (page: Page, wet: boolean) =>
  page.waitForFunction((want) => window.__loamkeep?.().inWater === want, wet, { timeout: ARRIVE });

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
   * A jump to the right, held through the landing.
   *
   * Both jumps in the take clear one tile, so the jump key is held long enough to reach the full
   * arc rather than tapped — a tap is a hop and this game lets you choose. The walk key stays down
   * for the whole flight, which is what carries the player across; the wait is on landing, not on
   * the key, so a jump that fell short fails here instead of filming a player in a hole.
   */
  const jumpRightTo = async (arrived: () => Promise<unknown>) => {
    await page.keyboard.down(KEY.right);
    await page.keyboard.down(KEY.jump);
    // The full arc: 64 px up, about 58 px across. Released early it is a hop — the game gives you
    // the choice and both jumps in this take need the whole thing.
    await page.waitForTimeout(500);
    await page.keyboard.up(KEY.jump);
    try {
      await arrived();
    } finally {
      await page.keyboard.up(KEY.right);
    }
    await demo.dwell(400);
  };

  await demo.open("/");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The title");
  // The game boots on a painted dawn: seven sky bands, the sun coming up behind the keep, a rabbit
  // on the ground that is the same rabbit the meadow has. Nothing is pressed for a few seconds —
  // the cursor blinks, the sun climbs, and the second entry reads LANDMARKS (EMPTY) because
  // Playwright's browser is cold and the book is the one thing this game keeps.
  await demo.dwell(4200);
  await demo.press(KEY.confirm);
  await whenMode(page, "playing");
  await demo.dwell(900);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The meadow");
  // A few steps left to the ledge — the gap at cols 6-7, the stone marker on its platform across
  // it — then a jump on the spot, which is the whole of the platforming vocabulary: a held key
  // goes higher than a tap, the rise is lighter than the fall.
  await walkLeftTo(MEADOW.leftLedge);
  await demo.dwell(1100);
  await demo.hold(KEY.jump, 300);
  await demo.dwell(1400);
  await demo.still("the-meadow");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("A first meeting");
  // The rabbit paces this platform at 32 px/s and the player walks at 72, so walking right is
  // enough to meet it. The first time you touch one, the game stops and it says something.
  await demo.holdWhile(KEY.right, () => whenGreeting(page, true));
  await demo.dwell(2600);
  await demo.still("a-first-meeting");
  // Any movement key closes it — the same key that will carry the walk on.
  await demo.hold(KEY.right, 120);
  await whenGreeting(page, false);
  await demo.dwell(700);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("Under the meadow");
  // The grass ends at col 19 and the shaft under it is one tile wide, walled with dirt on both
  // sides. So the key is released the moment the player steps off: steering right inside a
  // one-tile shaft lands them on the wall's shoulder at row 10, wedged, and the take dies there.
  // Let go, fall straight, and the shelf at row 13 catches it.
  await demo.holdWhile(KEY.right, () => whenAirborne(page));
  await whenLanded(page, 0, MEADOW.shelfY);
  await demo.dwell(1100);
  // From the shelf the walk can be held again: the shaft opens at col 21 and everything below is
  // the cavern, which is wide enough that a fall cannot miss the pool.
  await demo.holdWhile(KEY.right, () => whenInWater(page, true));
  await demo.dwell(1500);
  await demo.still("the-lake");

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("A page written");
  // Wading is slower than walking, and the submerged half of the player is tinted blue while the
  // surface ripples over it. The sunken stone sits on the pool's floor; E writes its page.
  await walkRightTo(MEADOW.sunkenStone - 10);
  await demo.dwell(900);
  await demo.press(KEY.interact);
  await whenSketchbook(page, true);
  await demo.dwell(3200);
  await demo.still("the-sketchbook");
  await demo.press(KEY.interact);
  await whenSketchbook(page, false);
  await demo.dwell(600);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The deep water");
  // Out of the pool over its one-tile shore, right along the cavern floor, then down the three
  // steps the right-hand side of the level is: each one a fall the walk takes on its own. The deep
  // lake is the last of them, and the fish live in it.
  await walkRightTo(MEADOW.poolExit);
  await jumpRightTo(() => whenLanded(page, MEADOW.poolExit + TILE, MEADOW.cavernFloorY));
  await whenInWater(page, false);
  await demo.holdWhile(KEY.right, () => whenLanded(page, MEADOW.keepDoor - 4, MEADOW.doorFloorY));
  await demo.dwell(800);
  // Left off the step into the water: hold down to dive, and the slow sink is the game's, not
  // gravity's.
  await demo.holdWhile(KEY.left, () => whenInWater(page, true));
  await demo.hold(KEY.dive, 1600);
  await demo.dwell(1800);
  await demo.still("the-deep-water");
  // Up and out: the swim is slow on purpose, and leaving the surface with upward momentum pops the
  // player onto the bank a tile above it. Both keys go down together and both come up the frame the
  // bank is underfoot — held for a length of time instead, the walk continues after the landing,
  // and since that length is scaled by DEMO_SPEED the take would walk past the door at 1 and stop
  // short of it at 4. This is the bug the whole file is written to avoid, found the hard way.
  await page.keyboard.down(KEY.right);
  await page.keyboard.down(KEY.jump);
  try {
    await whenOnDryGround(page);
  } finally {
    await page.keyboard.up(KEY.jump);
    await page.keyboard.up(KEY.right);
  }
  await demo.dwell(900);

  // ---------------------------------------------------------------------------------------------
  await demo.chapter("The old keep");
  // The door is on the bottom step. E tears the level layer down and builds the keep around the
  // same player, at the spawn its door names.
  await walkRightTo(MEADOW.keepDoor - 4);
  await demo.dwell(700);
  await demo.press(KEY.interact);
  await whenLevel(page, "old-keep");
  await demo.dwell(1600);
  await demo.still("the-old-keep");
  // Cool grey brick, a polished floor, gold pillars and candles the length of the hall — walked
  // end to end, because the only way down is the hole at the far end of it.
  await demo.holdWhile(KEY.right, () => whenRightOf(page, KEEP.floorHole));
  await whenLanded(page, 0, KEEP.basementY);
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
  // chandelier and a candelabrum. The floor has a hole in it; the inscription is on the far side.
  await demo.dwell(2200);
  await demo.still("the-crypt");
  await walkRightTo(CRYPT.gapEdge);
  await demo.dwell(800);
  await jumpRightTo(() => whenLandedAbove(page, CRYPT.landing, CRYPT.floorY));
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
  await demo.press(KEY.menuDown);
  await demo.dwell(600);
  await demo.press(KEY.confirm);
  await whenSketchbook(page, true);
  await demo.dwell(2000);
  await demo.still("the-gallery");
  // Through the pages the take wrote, and onto the leaf that ends the book: how many are still
  // blank, never which ones.
  await demo.press(KEY.right);
  await demo.dwell(2200);
  await demo.press(KEY.right);
  await demo.dwell(3000);

  // The take's own closing assertion: the book holds what the run put in it, and the title behind
  // the gallery is counting the same pages.
  const end = await look(page);
  if (end.pagesWritten < 2) {
    throw new Error(`demo: the take wrote ${end.pagesWritten} of ${end.pagesTotal} pages — it should have written 2`);
  }
});
