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
- `events.json` — every key and pause, on the film's clock: see **For the landing page's films**
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

Nine chapters, one per beat, filmed in HD, at the default `DEMO_SPEED=1`. The picture never cuts.
The meadow is the 200 × 96 one (LOA-52), and the take crosses it the way a player walking it for
the first time would, from the forest edge to the keep's door at the foot of the well.

| | | |
|---|---|---|
| 0:00 | The title | the painted dawn — seven sky bands, the sun coming up behind the keep, the rabbit that also lives in the meadow — and the landmarks entry at zero, because the browser is cold; then ENTER THE MEADOW and the twenty-frame wave wipe that carries the title under in 16-px squares |
| 0:06 | The meadow | a few steps left past the starting cairn, whose lantern lights as the player goes by, to the ledge over the first hole down, and a jump on the spot |
| 0:10 | A first meeting | the rabbit paces this grass at 32 px/s and the player walks at 72, so walking right is enough; the parchment popup, its line of speech, and any movement key closing it |
| 0:17 | The canopy | up the first vine onto the branch at its top, along it — a bird stops to talk — up the long vine to the top of the canopy, the Ruined Arch, E, its page; then down the way a player comes down, off the end of one branch onto the next and off that to the grass |
| 0:40 | The mill | over the ravine and the mouth of the Root Shaft, past the stream's cairn, into the stream; the jump key held pops the player out at every surface, over both stepping stones, to under the wheel, and bobbing there until a paddle comes up under them; the ride over the top, the jump off onto the roof, the weathervane's page |
| 1:04 | The field | the first hay bale pushed up to the loft's post and climbed, the owl on the loft; a jump off the loft's far end that lands in the brambles, the wave, and the player put back down at the field's cairn; back up, down the far end on foot, and the second bale pushed into the brambles as a stepping stone over them |
| 1:32 | The old keep | onto the well's rim stone and down its shaft to the keep's door at its foot; inside, cool grey brick, a polished floor, gold pillars and candles the length of the hall — walked end to end because the only way down is the hole at the far end, then back along the basement to the door under it |
| 1:57 | The crypt | near-black masonry in two neutral greys mixed outside the palette on purpose, a chandelier and a candelabrum; the floor has a hole in it, and the inscription is across the hole |
| 2:07 | The sketchbook | Esc fades back to a title that now counts pages, and the gallery reads the book back: the three pages the take wrote, then the leaf that says how many are still blank — never which ones |

## What this run actually measured

**The take across the rebuilt meadow** (LOA-52), filmed on 2026-10-24 at `DEMO_SPEED=1`, 1280×720
at a device scale factor of 3, in HD:

- 2:23 of film, 142.9 s, nine chapters. The screencast delivered 8428 frames at 59.0 fps.
- The mp4 is 6.8 MB at CRF 26, 0.38 Mbit/s: longer than the take before it, and a little denser for
  the canopy, the wheel and the field, which are busier pictures than a cavern pool.
- Nine stills at 3840×2160, 52 KB–74 KB each.
- Three takes went before it. The first stopped at the long vine (see the traps), the second on the
  second hay bale; the third is this one.


**The HD take** (LOA-41), filmed on 2026-10-11 at `DEMO_SPEED=1`, 1280×720 at a device scale factor
of 3, in the art the game now opens in:

- 1:25 of film, 85.4 s, nine chapters. The screencast delivered 5015 frames at 58.7 fps; the HD
  pass costs the recording nothing.
- The mp4 is 3.4 MB at CRF 26, 0.32 Mbit/s, against 0.20 for classic's take of the same storyboard
  on the same day. The dither and the selout are detail the encoder has to keep, which makes it
  half as much again. CRF 26 holds: that is still a fraction of the consoles' band, and the
  dither survives the encode without crawling.
- Nine stills at 3840×2160, 52 KB–66 KB each.
- The crypt was rebuilt after the last take, and its beat was the one to break: see the trap below.

The take shipped to the landing page, filmed on 2026-09-15 at `DEMO_SPEED=1`, 1280×720 at a device
scale factor of 3:

- 1:27 of film — 87.6s, nine chapters at the marks in the table above. The screencast delivered
  5151 frames at 58.8 fps; the mp4 is 2.7 MB at CRF 26, 0.25 Mbit/s — far under the band the
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
| `01-the-meadow.png` | the player at the ledge on the forest edge, the starting cairn lit, the canopy over them — the landing page's card thumbnail |
| `02-a-first-meeting.png` | the rabbit's greeting, mid-sentence |
| `03-the-sketchbook.png` | the Ruined Arch's page, open over the top of the canopy |
| `04-the-mill-wheel.png` | the player riding a paddle up the mill wheel, the stream and its stepping stones below |
| `05-the-field.png` | the owl's greeting, on the hay loft |
| `06-the-old-keep.png` | the hall on arrival: three floors, gold pillars, candles |
| `07-the-crypt.png` | the crypt by candlelight |
| `08-the-title.png` | the title again, its entry now counting the pages the take wrote |
| `09-the-gallery.png` | the gallery, page one of three |

## Classic beside HD: `pnpm video:split`

A second project in the same config, with no film: `split.stills.ts` opens the game at `?art=split`
(classic on the left half of the screen, HD on the right), shoots the title, then drops the player
at each of the nine levels' spawns through the dev handle `__loamkeep.travel` and shoots again.
That makes ten stills in about fifteen seconds, in `out/split/00-title.png` … `09-cairn-observatory.png`,
taken from the running game. They are the before and after the HD tickets are judged by.
`pnpm video:generate` runs only the take.

## For the landing page's films: `events.json`

The landing page cuts a film of about fifty seconds from this take with Remotion
(`landing-page/films/`): the whole window throughout, faster where the hero only walks, a line of
text over a held frame between places. Every take also writes `events.json` (`events.ts`, ported
from bkmk's harness with the log in `cursor.ts`, `fixture.ts` and `recorder.ts`): the chapters,
every press, every key and every pause, with its start and end on the film's clock. The walking is
held keys and is not logged as presses, so the edit binds its beats to the chapters, the `E`,
`Enter` and arrow presses and the pauses between them — never to a second — and a re-take keeps
it. A take for a film is filmed without the drawn arrow:

```bash
DEMO_CURSOR=off DEMO_FPS=30 pnpm video:generate
```

## Running it again

The take writes nothing outside `out/`. The game has no account and no server, and its one piece of
persistence — `loamkeep.sketchbook.v1` in localStorage — belongs to Playwright's browser, which is
cold on every run: that is what makes chapter one's empty landmarks book and the last chapter's
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

**A greeting moves the player.** The key that closes a parchment is a movement key, and it is held
for a beat: the walk carries on a few pixels past wherever the creature stopped it. On the canopy's
branch a bird stops the walk next to the long vine, and the tap that closes its greeting carried
the player into the next column — off the vine, where Up is a jump, not a climb. The take died
there, waiting to climb. The beat now walks back onto the vine's column, from whichever side,
before it climbs.

**`demo.hold` waits after letting go, and a held key carries on through the wait.** The hop onto a
bale is Space for 130 ms with Right down; through `demo.hold`, Right stayed down for its settle
too, and the hop onto the second bale — the one pushed into the brambles — sailed on over its far
side into them. The hop presses the keys itself, and lets go of Right the moment the player is over
the bale.

**The wheel's turn is not on the snapshot.** No beat can wait for a paddle to be in a place, so the
mill chapter waits for the ride instead: the player bobs at the stream's surface under the wheel,
jump held, until a paddle comes up under them, which on any take is a few seconds. Over the top the
rider is at x 1146 and a full arc from there lands short of the roof; the jump waits for the paddle
to carry them on to x 1170, coming down the far side.

**The well has a rim.** A stone of it stands over the mouth of the well at col 129 and stops a walk
dead, which reads as the walk arriving. The beat hops onto the stone and steps off its far side, and
the shaft beside the ladder drops the player to the door.

**The keep's two doors are on different floors.** The meadow's door lands the player on the lower
floor; the one down to the crypt is in the basement, under the hole at cols 36-37. Walking right
from the spawn and pressing E where the door "should" be is fifteen seconds of film and then a
timeout.

**The crypt's inscription hangs over the hole in the floor.** Its tile, col 11, is the gap's second
one, so the slab cannot be stood under. The jump lands on col 12 and E is pressed from there —
fourteen pixels from the slab's centre, inside the sixteen the interact range allows. Walking left
to centre the player on it walks them into the hole.

**A jump keeps walking after it lands.** Right is held for the whole arc, and the wait that
releases it resolves a few frames after touchdown. In the rebuilt crypt that slide carried the
player some forty pixels past the lid, well outside the sixteen the interact range allows, and E
read nothing. The beat now walks back left onto col 12 before pressing E.

**`import.meta.dirname`, not `__dirname`.** This package is `"type": "module"` where Halcyon's is
not, so the harness is loaded as ESM. The failure reads `No tests found`, with the real error a few
lines above it.
