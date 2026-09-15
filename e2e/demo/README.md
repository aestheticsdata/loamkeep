# Demo films

One Playwright run that plays the game the way a hand would, records it as a single continuous
video, and writes the chapter list beside it. No editing: the take *is* the video, and the chapter
file is what goes in the description.

```bash
pnpm video:generate
```

Output lands in `e2e/demo/out/` (gitignored):

- `loamkeep-demo.mp4` — the take, h264, at the exact viewport size, no scaling, with the chapters
  written into the file itself
- `chapters.txt` — `0:00 Title` per line, for a human to read
- `chapters.vtt` — WebVTT, for `<track kind="chapters">` on the portfolio's own `<video>`
- `chapters.ffmeta` — ffmpeg metadata; already applied to the mp4, kept so a re-encode can reapply it
- `chapters.json` — the same marks with millisecond precision
- `shots/01-the-meadow.png` and eight more — stills at 3840×2160, for a page that wants pictures too

This is a port of Halcyon's harness, which is a port of PFA's, which is a port of Trekker's, which
is a port of Zeus's, which is a port of Spira's. `pacing.ts`, `recorder.ts`, `chapters.ts` and
`cursor.ts` are byte-identical to Halcyon's. `fixture.ts` is Halcyon's with the parts that were
about Halcyon removed rather than changed, plus the three methods a platformer needs and a console
does not — `hold`, `holdWhile`, `still`, all documented where they are defined. `preflight.ts` and
`playwright.demo.config.ts` are the same files with the wording and two knobs adjusted. The full
write-up of how it works and why — the CDP screencast, the encode, and every trap found building
it — is `front/e2e/demo/HOW-TO-FILM-A-DEMO.md` in the Spira repo. Only `loamkeep.demo.ts` knows
what Loamkeep is.

## What it needs before it will record

`preflight.ts` refuses to launch a browser until the first is true, and says so. The rest it
cannot check.

1. **The dev server on `localhost:5173`** — `pnpm dev`, in a shell of your own: the take films the
   game and never starts it. Vite prints the port it took; if it was not 5173, `E2E_BASE_URL`
   names the one it did. It has to be the dev server and not a preview of `dist/`: `main.ts` only
   hangs the game's snapshot on `window` under `import.meta.env.DEV`, and that snapshot is what
   every beat in the storyboard waits on.
2. **ffmpeg on `PATH`** with libx264, the mp4 muxer and the `concat` demuxer — `brew install ffmpeg`,
   or `DEMO_FFMPEG` pointing at one.
3. **Disk, a couple of gigabytes.** The screencast spools every frame as a JPEG under `out/frames/`
   before the encode — a game that repaints the whole screen every frame produces one per frame at
   58 fps. The spool is deleted once the mp4 is written.

Nothing from the network, unlike every earlier port: the game asks for no font and no stylesheet,
which is why `settle()` here waits for a canvas instead of for `document.fonts.ready`.

## The take

Nine chapters, one per beat, at the default `DEMO_SPEED=1`. The picture never cuts. The route only
ever goes down, because that is how the meadow is built — there is no way back up a shaft and no
death to end a wrong turn, so the storyboard walks off a ledge where a player would.

| | | |
|---|---|---|
| 0:00 | The title | the painted dawn — seven sky bands, the sun coming up behind the keep, the rabbit that also lives in the meadow — and the second entry reading LANDMARKS 0/8, because the browser is cold; then ENTER THE MEADOW and the twenty-frame wave wipe that carries the title under in 16-px squares |
| 0:05 | The meadow | a few steps left to the ledge over the first shaft, the stone marker on its platform across it, and a jump on the spot: the whole platforming vocabulary, since holding the key goes higher than tapping it |
| 0:09 | A first meeting | the rabbit paces this platform at 32 px/s and the player walks at 72, so walking right is enough; the parchment popup, its line of speech, and any movement key closing it |
| 0:15 | Under the meadow | off the end of the grass, down the one-tile shaft onto the shelf at row 13, off that and into the cavern pool |
| 0:20 | A page written | wading is slower than walking and the submerged half of the player is tinted blue under a rippling surface; the sunken stone on the pool floor, E, and the page it writes |
| 0:26 | The deep water | out over the pool's one-tile shore, right along the cavern floor and down the three steps the right-hand side of the level is, then left off the last one into the deep lake: a dive, the fish, and the exit pop back onto the bank |
| 0:41 | The old keep | the door on the bottom step; inside, cool grey brick, a polished floor, gold pillars and candles the length of the hall — walked end to end because the only way down is the hole at the far end, then back along the basement to the door under it |
| 1:01 | The crypt | near-black masonry in two neutral greys mixed outside the palette on purpose, a chandelier and a candelabrum; the floor has a hole in it, and the inscription is across the hole |
| 1:11 | The sketchbook | Esc fades back to a title that now counts pages, and the gallery reads the book back: both pages the take wrote, then the leaf that says how many are still blank — never which ones |

## What this run actually measured

The take shipped to the landing page, filmed on 2026-09-14 at `DEMO_SPEED=1`, 1280×720 at a device
scale factor of 3:

- 1:27 of film — 87.3s, nine chapters at the marks in the table above. The screencast delivered
  5169 frames at 59.2 fps; the mp4 is 2.8 MB at CRF 26, 0.25 Mbit/s — far under the band the
  consoles' takes sit in, because a 320×224 picture upscaled threefold is mostly flat colour, and
  the black the frame puts around it is flatter still.
- 1.7 minutes end to end: the take, then the encode and the stills in the fixture's teardown, well
  inside the config's fifteen-minute timeout.
- Nine stills at 3840×2160, 33 KB–192 KB each as lossless PNG. The viewport shrank and the scale
  factor grew to hold that number: a still is one times the other.
- One take went before it, and it died in the keep — the pumpkin that commit `125e042` put in the
  entry hall stops the game to introduce itself, and the beat was holding Right against a player
  who could not move. `walkRightMeeting` is what came of it. Rehearse first.

## The stills

`demo.still("name")` takes the picture **now**, where every earlier port writes the URL down and
revisits it after the take. That is not a preference, it is the game: Loamkeep has one URL and
keeps everything in memory, so a revisit is the title screen with an empty book and no `prepare`
could walk the player back to the bottom of the lake. What made the revisit worth it elsewhere —
that painting the drawn pointer out for a capture blinks it out of the film — does not apply here:
this game hides the cursor and the config turns the drawn one off, so a still is simply a frame of
the film saved losslessly at twice its resolution.

| | |
|---|---|
| `01-the-meadow.png` | the player on the spawn platform under the parallax hills — the landing page's card thumbnail |
| `02-a-first-meeting.png` | the rabbit's greeting, mid-sentence |
| `03-the-lake.png` | waist-deep in the cavern pool, tinted blue under the surface |
| `04-the-sketchbook.png` | the Sunken Stone's page, open over the world |
| `05-the-deep-water.png` | the deep lake with its fish, the keep's door on the bank |
| `06-the-old-keep.png` | the hall on arrival: three floors, gold pillars, candles, a pumpkin |
| `07-the-crypt.png` | the crypt by candlelight |
| `08-the-title.png` | the title again, its entry now counting the pages the take wrote |
| `09-the-gallery.png` | the gallery, page one of two |

## Running it again

The take writes nothing outside `out/`. The game has no account and no server, and its one piece of
persistence — `loamkeep.sketchbook.v1` in localStorage — belongs to Playwright's browser, which is
cold on every run: that is what makes chapter one's LANDMARKS 0/8 and the last chapter's two
pages both reliable. Your own tab on `localhost:5173` is not touched, and its sketchbook is yours.

## Loamkeep-specific traps

**The GPU flags are the difference between a film and a slideshow.** Headless Chromium falls back
to SwiftShader, which rasterises on the CPU. This game repaints every pixel of the screen every
frame — parallax, water, a player figure rebuilt from `rect()` calls — so against a 3840×2160
compositor surface the screencast delivered **8.6 fps**. That surface is what the cost is measured
in, not the frame: it was 1920×1080 at a device scale of 2 when this was first measured and it is
1280×720 at 3 now, which is the same number of pixels and the same slideshow without the flags
below. The same take with `--enable-gpu --use-angle=metal
--ignore-gpu-blocklist` delivers **58**. The five consoles this harness filmed never noticed: a
mostly-still UI costs SwiftShader almost nothing.

**A held key is not a gesture.** Every beat waits on the player having arrived, never on a duration,
and the one place that broke the rule broke the take: the swim out of the deep lake held Right for
a fixed 2600 ms, which at `DEMO_SPEED=4` stopped short of the door and at 1 walked past it — the
same storyboard, two different failures, neither of them visible until the E three lines later did
nothing. `holdWhile` exists so that cannot happen.

**Do not steer inside a one-tile shaft.** The first descent is the gap at cols 20-22, and the shaft
under it is one tile wide with dirt on both shoulders. Holding Right through the fall lands the
player on the shoulder at row 10, wedged against the wall, and the take dies there. The key is
released the moment the player leaves the ledge.

**The keep's two doors are on different floors.** The meadow's door lands the player on the lower
floor; the one down to the crypt is in the basement, under the hole at cols 36-37. Walking right
from the spawn and pressing E where the door "should" be is fifteen seconds of film and then a
timeout.

**The crypt's inscription hangs over the hole in the floor.** Its tile, col 11, is the gap's second
one, so the slab cannot be stood under. The jump lands on col 12 and E is pressed from there —
fourteen pixels from the slab's centre, inside the sixteen the interact range allows. Walking left
to centre the player on it walks them into the hole.

**`import.meta.dirname`, not `__dirname`.** This package is `"type": "module"` where Halcyon's is
not, so the harness is loaded as ESM. The failure reads `No tests found`, with the real error a few
lines above it.
