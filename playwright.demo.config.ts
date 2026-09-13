import { defineConfig, devices } from "@playwright/test";

// The two knobs this harness sets for itself. Both are read by code running in the worker, which
// inherits this process's environment, and both are `??=` so an explicit value on the command line
// still wins.
//
// CRF: the recorder's own 16 is right for the consoles the other five film, whose picture is still
// between gestures and costs x264 almost nothing. Nothing here is ever still — parallax slides, the
// water surface ripples, and the player figure is rebuilt from `rect()` calls every frame — so this
// is Halcyon's case, where the same CRF came out at 1.9 Mbit/s, three times Zeus's take.
process.env.DEMO_CRF ??= "26";
// Cursor: there is no mouse in this game. The pointer never moves, so the drawn arrow would sit
// wherever it was parked for the whole film; the game hides the real cursor over its canvas for the
// same reason. Off is not a deprivation here — `Cursor` still carries the keyboard.
process.env.DEMO_CURSOR ??= "off";

/**
 * The portfolio demo run — a filming job, not a test one. There is no E2E suite beside it in this
 * repo, and no unit suite either: this is the only thing under `e2e/` and the only automated run
 * the project has.
 *
 * One worker, no retries (half a retried take is worse than no take), a long timeout because the
 * run deliberately spends most of its time waiting, and video at the exact viewport size, so no
 * scaling ever touches the picture.
 *
 * One project where PFA has two: the console has no account, so there is nothing a setup project
 * would have to put back before a take. The browser is cold on every run and the take opens on `/`.
 */

/**
 * 1080p by default: native, 16:9, and nothing upscales on the way to a landing page.
 *
 * The game fills it as far as a 320×224 picture can — `stageScale()` takes the largest whole
 * upscale that fits, which at 1080 tall is ×4, a 1280×896 canvas centred on `index.html`'s
 * near-black ground. The bands left and right are not a fault to fix: 10:7 does not become 16:9
 * without either cropping the world or putting half a pixel of art on a screen pixel. A frame
 * around an arcade screen is the honest way to show one.
 */
const viewport = {
  width: Number(process.env.DEMO_WIDTH ?? 1920),
  height: Number(process.env.DEMO_HEIGHT ?? 1080),
};

/**
 * Renders at twice the resolution and lets the encoder downsample into the same
 * frame. Supersampling: visibly crisper text, for CPU. It is the default
 * because `pnpm video:generate` should produce the best picture it can without
 * being asked — `DEMO_SCALE=1` is the way out if a slow machine drops frames.
 */
const deviceScaleFactor = Number(process.env.DEMO_SCALE ?? 2);

const chrome = {
  ...devices["Desktop Chrome"],
  viewport,
  deviceScaleFactor,
  // The console is English-only and formats its own readouts, so nothing on screen reads the
  // locale. Pinned anyway, so a take is the same film on whichever machine shoots it.
  locale: "en-US",
  launchOptions: {
    headless: process.env.DEMO_HEADED !== "1",
    // The three GPU flags are this harness's own, and they are the difference between a film and a
    // slideshow. Headless Chromium falls back to SwiftShader, which rasterises on the CPU; this
    // game repaints every pixel of the screen every frame, so at 1920x1080 and a device scale of 2
    // the screencast delivered 8.6 fps — the same take, with ANGLE pointed at Metal, delivers 58.
    // The five consoles this harness filmed never noticed: a mostly-still UI costs SwiftShader
    // almost nothing. Nothing about the picture changes, only who draws it.
    args: [
      "--force-color-profile=srgb",
      "--hide-scrollbars",
      "--enable-gpu",
      "--use-angle=metal",
      "--ignore-gpu-blocklist",
    ],
  },
};

export default defineConfig({
  testDir: "./e2e/demo",
  // Checks the dev server is actually up before a browser is launched, so a
  // shut-down server is reported as a shut-down server rather than as a
  // navigation failure inside the fixture.
  globalSetup: "./e2e/demo/preflight.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Fifteen minutes, as Halcyon has: the take is walked rather than clicked, so it spends most of
  // its length waiting for a player to arrive somewhere, and the encode that follows in the
  // fixture's teardown counts against the same timeout.
  timeout: 15 * 60_000,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "off",
    // Off unless asked for: the CDP recorder in `e2e/demo/recorder.ts` captures
    // the same screencast without the 25fps ceiling, and running both at once
    // would have two clients acking the same frames.
    video: process.env.DEMO_RECORDER === "playwright" ? { mode: "on" as const, size: viewport } : ("off" as const),
  },
  projects: [{ name: "demo", testMatch: /.*\.demo\.ts/, use: chrome }],
});
