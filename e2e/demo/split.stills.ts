import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { OUT_DIR } from "@e2e/demo/fixture";
import { expect, type Page, test } from "@playwright/test";

/**
 * Stills of split view to judge the HD pass by (LOA-41): the title and the nine levels where the
 * player arrives, each with classic on the left half of the screen and HD on the right, taken
 * from the running game rather than mocked up. No film and no chapters: `pnpm video:split`.
 *
 * It needs the dev server, like the take: `__loamkeep.travel` is the dev handle that drops the
 * player at a level's spawn, which is what lets ten stills cost ten seconds instead of the take's
 * ninety. Output: `out/split/00-title.png` … `09-cairn-observatory.png`.
 */

// In the order the world opens them, so the numbering reads as a walk.
const LEVELS = [
  "meadow",
  "old-keep",
  "old-keep-library",
  "old-keep-belfry",
  "old-keep-crypt",
  "flooded-cistern",
  "glow-grotto",
  "kitchen-garden",
  "cairn-observatory",
] as const;

const DIR = join(OUT_DIR, "split");

async function shoot(page: Page, name: string): Promise<void> {
  await page.locator("canvas").screenshot({ path: join(DIR, `${name}.png`) });
}

// A first meeting at the spawn opens a greeting over the level; any movement key closes it.
async function dismissGreeting(page: Page): Promise<void> {
  for (let k = 0; k < 3; k++) {
    const open = await page.evaluate(
      () => (window as unknown as { __loamkeep: () => { greetingOpen: boolean } }).__loamkeep().greetingOpen,
    );
    if (!open) return;
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
  }
}

test("loamkeep, classic beside hd", async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?art=split");
  await page.locator("canvas").waitFor();
  // The sun is up and the wordmark has swept once.
  await page.waitForTimeout(2500);
  await shoot(page, "00-title");
  await page.keyboard.press("Enter");
  // The wave wipe, then the meadow's own first frames.
  await page.waitForTimeout(3000);
  for (const [i, id] of LEVELS.entries()) {
    await page.evaluate(
      (id) => (window as unknown as { __loamkeep: { travel: (id: string) => void } }).__loamkeep.travel(id),
      id,
    );
    await page.waitForTimeout(800);
    await dismissGreeting(page);
    await shoot(page, `${String(i + 1).padStart(2, "0")}-${id}`);
  }
  expect(errors).toEqual([]);
});
