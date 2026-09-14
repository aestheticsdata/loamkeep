import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Chapters } from "@e2e/demo/chapters";
import { Cursor } from "@e2e/demo/cursor";
import { PACE, resetJitter, sleep } from "@e2e/demo/pacing";
import { CdpRecorder } from "@e2e/demo/recorder";
import { test as base } from "@playwright/test";

import type { GestureOptions } from "@e2e/demo/cursor";
import type { Locator, Page } from "@playwright/test";

/**
 * The demo fixture: one continuous take, from a painted console to a written
 * chapter list.
 *
 * Everything a scenario needs is on `demo`, and nothing else should be: a
 * scenario file is meant to read as a storyboard — click this, dwell here,
 * open that chapter — with the mechanics of pointer paths, caption overlays
 * and video files kept out of it entirely.
 */

/**
 * Beside the scenario rather than in Playwright's output dir, which is wiped per run.
 *
 * `import.meta.dirname` where the five earlier ports say `__dirname`: this package is
 * `"type": "module"`, so the harness is loaded as ESM and the CommonJS globals are not there to
 * read. The failure is not subtle — the run reports `No tests found` and the real error a few
 * lines above it — but it is the one thing in this file that had to change for a reason that has
 * nothing to do with the game.
 */
export const OUT_DIR = join(import.meta.dirname, "out");

/**
 * `DEMO_RECORDER=playwright` falls back to Playwright's own recorder — 25fps
 * VP8 at whatever `-speed 8` produces. Kept for comparison, and as a way out if
 * ffmpeg is missing. See `recorder.ts` for why it is not the default.
 */
const USE_PLAYWRIGHT_RECORDER = process.env.DEMO_RECORDER === "playwright";

/**
 * How long a `networkidle` wait is given before it is abandoned.
 *
 * It has to be stated, and the reason is not obvious. Under the test runner
 * Playwright defaults `navigationTimeout` to `0`, and `0` means *no timeout*
 * (`navigationTimeout: [0]` in `playwright/lib/index.js`, then
 * `setDefaultNavigationTimeout(0)`, and `kNoTimeout` in `timeoutSettings.ts`).
 * So an unqualified `waitForLoadState("networkidle")` never rejects: on an app
 * that holds a socket open — a live layer, SSE, a polling query — it blocks
 * until the whole test times out, eight minutes later, and the `.catch()`
 * wrapped around it never runs. Any app modern enough to be worth filming is a
 * candidate for that.
 */
const SETTLE_TIMEOUT = 5_000;

/** How long the game is given to put its canvas on the page. */
const BOOT_TIMEOUT = 10_000;

/**
 * Waits for the page to finish dressing itself — and refuses to go on if it
 * never does.
 *
 * Spira, where this harness comes from, shipped a whole take before anyone
 * looked closely. It draws its project icons with a ligature font served from
 * fonts.googleapis.com, so `graph_3` is markup that only becomes a glyph once
 * that stylesheet lands. It did not land. Every icon in the film, and in all
 * four stills cut from it, is the literal word `graph_3` spilling out of an
 * 18px box and across the name beside it. Nothing threw, nothing timed out,
 * and the run reported a clean ninety-six seconds.
 *
 * Loamkeep cannot fail that way, and that is the reason the check is gone
 * rather than kept: it asks for no stylesheet and no font. `index.html` carries
 * its own `<style>`, the world is `Graphics` primitives, and the two kinds of
 * text on screen are a 5x7 bitmap font drawn with `rect()` and a handful of
 * Pixi `Text` set in `monospace` — a family every machine resolves without
 * asking the network. There is nothing here whose absence would film as the
 * wrong picture.
 *
 * What can go wrong instead is the module graph: a boot error leaves the page
 * up, empty and silent, and `#app` simply never gets a canvas. So that is what
 * this waits for.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: SETTLE_TIMEOUT }).catch(() => {
    // A socket the live layer holds open keeps `networkidle` from ever
    // settling on some pages. The beats that follow wait on real elements.
  });

  await page
    .waitForFunction(() => {
      const canvas = document.querySelector("#app canvas");
      return canvas instanceof HTMLCanvasElement && canvas.width > 0;
    }, undefined, { timeout: BOOT_TIMEOUT })
    .catch(() => {
      throw new Error(
        "demo: the game never put a canvas in #app, so there is nothing to film.\n" +
          "    That is a boot error, not a slow machine — open the page and read the console.",
      );
    });

  await sleep(PACE.navigate);
}

/**
 * Anything a dev build floats over the app and a portfolio video must not show.
 *
 * Nothing, here. Vite's dev server paints no badge, no devtools logo and no overlay of its own
 * over the page — the error overlay only appears on a failed compile, and a take filmed over one
 * is a take to throw away, not to retouch. The function is kept as the seam the six harnesses
 * share, so a later dependency that does float something has a place to be painted out.
 */
function hideDevChrome(): void {
  // Deliberately empty — see above.
}

/**
 * What a still may do to the page before the shutter, once the revisit has
 * settled: open a modal, type into the palette, pick files. It drives the real
 * page — `page.mouse`, `page.keyboard`, plain locators — never the drawn
 * pointer, which is painted out of the picture anyway. See `Demo.shot()`.
 */
export type Prepare = (page: Page) => Promise<void>;

/** A point in the page's client coordinates — where `Demo.drag` presses and where it lets go. */
export interface Point {
  x: number;
  y: number;
}

/**
 * A screen worth a picture: the name it gets filed under, where it was, and
 * what to do there before the shutter. See `Demo.shot()` for why a URL and not
 * a moment.
 */
interface Still {
  name: string;
  url: string;
  prepare?: Prepare;
}

export class Demo {
  /** Screens the storyboard asked for a picture of. Read by the teardown. */
  readonly stills: Still[] = [];

  constructor(
    readonly page: Page,
    private readonly cursor: Cursor,
    private readonly chapters: Chapters,
    private readonly recorder: CdpRecorder | null,
  ) {}

  /** Opens a chapter at the current moment of the recording. */
  chapter(title: string): Promise<void> {
    return this.chapters.open(title);
  }

  /** The one navigation a take types rather than clicks: its first. */
  private opened = false;

  async open(path: string): Promise<void> {
    await this.page.goto(path);
    // The only navigation of the take, so the only chance to find out whether
    // the app has everything it needs to draw itself. Everything after this is
    // a client-side route change onto a document that already settled here.
    await settle(this.page);

    // The film and the chapter clock both start HERE, on a page that has
    // painted — never on the `about:blank` the screencast was opened over.
    // Once: a second `open` would be a cut, not a new film.
    if (!this.opened) {
      this.opened = true;
      const now = Date.now();
      this.recorder?.rebase(now / 1000);
      this.chapters.rebase(now);
    }
  }

  moveTo(target: Locator, options?: GestureOptions): Promise<void> {
    return this.cursor.moveTo(target, options);
  }

  click(target: Locator, options?: GestureOptions): Promise<void> {
    return this.cursor.click(target, options);
  }

  /** Click a field, then type into it at a human rate. */
  async fill(target: Locator, text: string, options?: GestureOptions): Promise<void> {
    await this.cursor.click(target, options);
    await this.cursor.type(text);
    await sleep(PACE.settle);
  }

  /** `rate` slows one line without retiming the film — see `Cursor.type`. */
  type(text: string, rate?: number): Promise<void> {
    return this.cursor.type(text, rate);
  }

  press(key: string, options?: GestureOptions): Promise<void> {
    return this.cursor.press(key, options);
  }

  /**
   * The pointer walked to a point rather than to an element — PFA's addition to
   * the shared fixture, kept as it came. Its donut and its bars hit-test the
   * cursor from ONE handler on the graphic, so the storyboard works a point out
   * from the geometry and sends the hand there. Halcyon's picture is the same
   * kind of surface: one canvas, no element inside it to aim at.
   */
  glide(x: number, y: number): Promise<void> {
    return this.cursor.glideTo(x, y);
  }

  /**
   * A press held through a glide — Halcyon's addition, beside PFA's `glide`.
   *
   * An orbit is a drag on the picture and a slider is a drag on its thumb;
   * neither is a click, and `locator.dragTo()` teleports the mouse the way
   * `click()` does. Both points come from the storyboard, worked out from the
   * stage's box or a range input's track, and the hand is walked between them
   * with the button down — so the drawn arrow shows pressed for the whole
   * travel, and the app sees the pointermove stream a real drag produces.
   */
  async drag(from: Point, to: Point, options: GestureOptions = {}): Promise<void> {
    await this.cursor.glideTo(from.x, from.y);
    await sleep(PACE.aim);
    await this.page.mouse.down();
    await sleep(PACE.aim);
    await this.cursor.glideTo(to.x, to.y);
    await sleep(PACE.aim);
    await this.page.mouse.up();
    await sleep(PACE.settle + (options.dwell ?? 0));
  }

  /**
   * Scroll a list, with the pointer over it first — the wheel goes to whatever
   * is under the cursor, not to whatever has focus, so scrolling a list from a
   * pointer parked on the sidebar scrolls the sidebar.
   */
  async scroll(over: Locator, distance: number, duration?: number): Promise<void> {
    await this.cursor.moveTo(over);
    await this.cursor.wheel(distance, duration);
    await sleep(PACE.settle);
  }

  /** Time on screen with nothing happening: the beat that lets a viewer read. */
  dwell(base: number = PACE.dwell): Promise<void> {
    return sleep(base);
  }

  park(x?: number, y?: number): Promise<void> {
    return this.cursor.park(x, y);
  }

  /**
   * A key held down for a stretch — Loamkeep's addition, beside PFA's `glide`
   * and Halcyon's `drag`.
   *
   * The five consoles this harness filmed are driven by a pointer, and a
   * pointer's unit of action is instantaneous: click, drag, wheel. A platformer
   * has no such unit. Walking is the RIGHT key held for one and a half seconds,
   * and a jump that clears a gap is Space held while it is. `press()` — down and
   * up in the same tick — moves this player about one pixel.
   */
  async hold(key: string, held: number): Promise<void> {
    await this.page.keyboard.down(key);
    await sleep(held);
    await this.page.keyboard.up(key);
    await sleep(PACE.settle);
  }

  /**
   * A key held until something has actually happened, rather than for a length
   * of time — the primitive this whole storyboard is built on.
   *
   * A take driven by durations is a take that desynchronises: the walk to the
   * cairn takes 1.6s on a warm machine and 2.4s on a cold one, and by the third
   * beat the player is in the wrong place and every jump after it misses. `until`
   * is awaited with the key down — in practice a `waitForFunction` over the
   * snapshot `main.ts` exposes in a dev build — so the beat ends when the player
   * arrives and not before. The key is released even when the wait throws, or a
   * timeout would leave the player walking into a wall for the rest of the film.
   */
  async holdWhile(key: string, until: () => Promise<unknown>): Promise<void> {
    await this.page.keyboard.down(key);
    try {
      await until();
    } finally {
      await this.page.keyboard.up(key);
    }
    await sleep(PACE.settle);
  }

  /**
   * The shutter, now, on what is on screen.
   *
   * `shot()` below is the shared harness's way — write down the URL, revisit it
   * after the take — and it cannot work here. Loamkeep has one URL and keeps
   * everything in memory: a revisit is the title screen with an empty
   * sketchbook, and no `prepare` can walk the player back to the bottom of the
   * lake in under a minute. So the picture is taken during the take.
   *
   * What that costs elsewhere is the reason the shared harness refuses to do it:
   * painting the drawn pointer out for one capture blinks it out of the film for
   * a few frames. Here there is no pointer to paint out — the game hides the
   * cursor and `DEMO_CURSOR=off` draws none — and no caption unless one is asked
   * for, so a still is just a frame of the film, saved losslessly at twice the
   * video's resolution.
   */
  async still(name: string): Promise<void> {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new Error(`demo: still name must be lower-case kebab, got "${name}"`);
    }
    this.taken += 1;
    const file = join(OUT_DIR, "shots", `${String(this.taken).padStart(2, "0")}-${name}.png`);
    await this.page.screenshot({
      path: file,
      // Only the harness's own overlays, and only if `DEMO_TITLES=on` put one
      // on screen. A portfolio still should look like the game, not like a
      // recording of one.
      style: "#sp-demo-cursor, #sp-demo-caption { display: none !important; }",
      caret: "hide",
    });
  }

  /** How many stills the take has taken. They are numbered in the order they were shot. */
  private taken = 0;

  /**
   * Marks the screen on show as one to photograph.
   *
   * It takes nothing here. It writes down the URL, and that is all — the
   * pictures are taken further down, once the recorder has stopped, which is
   * the whole point: painting the drawn pointer out for a capture would blink
   * it out of the video for a few frames, and no still is worth costing the
   * take.
   *
   * The price is that only an addressable screen can be shot as it is. An
   * open dialog, a typed query, a chosen set of files: none of those survive a
   * revisit — so a still that wants one says how to get there again.
   * `prepare` runs on the revisited page, after it has settled and before the
   * shutter, and does with plain Playwright what the take did with the drawn
   * pointer. It must be repeatable and must not write: the stills pass runs
   * after the take, on whatever the take left, and again on the next run.
   */
  shot(name: string, prepare?: Prepare): void {
    // The name becomes a filename, so it is checked here rather than in the
    // teardown — a slash in it would write outside `out/shots`, or throw after
    // the whole take is already on disk.
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new Error(`demo: shot name must be lower-case kebab, got "${name}"`);
    }
    this.stills.push({ name, url: this.page.url(), prepare });
  }
}

/**
 * The stills pass — same page, same session, after the video is closed.
 *
 * A screenshot comes out at the viewport times `deviceScaleFactor`, so the 3x
 * that supersamples the video gives 3840x2160 here: three times the resolution
 * of the mp4, lossless, and with the harness's own overlays painted out. Pulling
 * the same frames back out of the finished video with ffmpeg cannot do any of
 * that — it is capped at the mp4's own 720p, it is h264, and the pointer is
 * baked in.
 */
async function captureStills(page: Page, stills: Still[], dir: string): Promise<string[]> {
  if (stills.length === 0) return [];
  // Wiped, not merged: the files are numbered by position, so a renamed or
  // dropped shot would otherwise leave last run's picture sitting in the
  // folder under a number that now belongs to something else.
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const files: string[] = [];
  for (const [index, still] of stills.entries()) {
    // Every still is a fresh document, so each one gets the same check the
    // take got: these are the frames that end up on a landing page, at twice
    // the resolution, where a font that has not swapped in is unmissable.
    await page.goto(still.url);
    await settle(page);
    // Then whatever the still asked for, and a beat for it to draw: a modal
    // animates in, a palette ranks its rows, a file list lays out.
    if (still.prepare) {
      await still.prepare(page);
      await sleep(PACE.navigate);
    }

    const file = join(dir, `${String(index + 1).padStart(2, "0")}-${still.name}.png`);
    await page.screenshot({
      path: file,
      // Injected for the capture and removed after it. A portfolio still
      // should look like the app, not like a recording of one.
      style: "#sp-demo-cursor, #sp-demo-caption { display: none !important; }",
      animations: "disabled",
      caret: "hide",
    });
    files.push(file);
  }
  return files;
}

export const test = base.extend<{ demo: Demo }>({
  demo: async ({ page }, use) => {
    resetJitter();
    // Wiped here rather than in the teardown, where `captureStills` wipes its
    // own: `Demo.still` writes during the take, so by then the folder holds
    // this run's pictures. Numbered by order, so a dropped beat would otherwise
    // leave last run's frame under a number that now belongs to something else.
    rmSync(join(OUT_DIR, "shots"), { recursive: true, force: true });
    mkdirSync(join(OUT_DIR, "shots"), { recursive: true });
    await page.addInitScript(hideDevChrome);
    const cursor = await Cursor.install(page);

    // Opened now, over a blank page, so that nothing the take draws is missed;
    // the film's actual first instant is set by `Demo.open`, once the app has
    // painted, and the chapter clock is moved to the same instant there.
    const recorder = USE_PLAYWRIGHT_RECORDER ? null : await CdpRecorder.start(page, join(OUT_DIR, "frames"));

    const chapters = await Chapters.install(page, Date.now());
    await cursor.park();

    const demo = new Demo(page, cursor, chapters, recorder);
    await use(demo);

    const totalMs = chapters.elapsed();

    // Chapters before the encode, so the encode can write them into the file.
    const marks = chapters.write(Chapters.path(OUT_DIR), totalMs);

    // Ours first, while the page is still open — it is reading a live CDP
    // session. Playwright's own recorder only finalises on close.
    let captured = "";
    if (recorder) {
      const { frames, sourceFps } = await recorder.stop(
        join(OUT_DIR, "loamkeep-demo.mp4"),
        Chapters.path(OUT_DIR).replace(/\.txt$/, ".ffmeta"),
      );
      captured = `, ${frames} frames at ${sourceFps.toFixed(1)}fps from Chromium`;
    }

    // After the encode, deliberately — see `shot()`. The one exception is
    // `DEMO_RECORDER=playwright`, whose recorder cannot be stopped before the
    // page closes: there, these revisits land in the tail of the webm.
    const shots = await captureStills(page, demo.stills, join(OUT_DIR, "shots"));

    const video = page.video();
    // Closing the page is what finalises Playwright's recording; without it
    // `saveAs` waits for a context teardown that has not been asked for yet.
    await page.close();
    if (video) await video.saveAs(join(OUT_DIR, "loamkeep-demo.webm"));

    const seconds = (totalMs / 1000).toFixed(1);
    console.log(`\n  demo: ${seconds}s, ${marks.length} chapters${captured} -> ${OUT_DIR}`);
    for (const mark of marks) console.log(`    ${(mark.atMs / 1000).toFixed(1).padStart(6)}s  ${mark.title}`);
    if (shots.length > 0) console.log(`  stills: ${shots.length} -> ${join(OUT_DIR, "shots")}`);
  },
});

export { expect } from "@playwright/test";
