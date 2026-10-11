# Brief for Claude Design: LOAMKEEP, the Potting Shed's interior (LOA-48)

## What the game is

LOAMKEEP is a calm, exploratory pixel-art platformer in a late-80s Amiga spirit.
- A small hooded figure (12×16 px) walks, jumps and climbs ladders through a meadow, a keep, a crypt, a cistern, a grotto, an observatory and a walled kitchen garden.
- There is no combat. You meet animals and find landmarks, and both fill parchment sketchbooks.

## The idea

In the Kitchen Garden stands a small potting shed: 112×96 px of brown boards, a door ajar, a window with a pot in it (see the attached screenshot). It looks like seven tiles of garden shed.

**You go in, and it is enormous.** It is a whole house that can't fit: rooms on the ground floor, two or three upper floors, a basement, and tunnels that run on under the garden. The joke should land on the first screen, so the entrance room is exactly the cramped shed you expect, with a bench, pots and a rake. Then a second doorway opens onto a hall far too wide.

The tone is cosy, a little magical, never spooky: a warm, lived-in, slightly cluttered house that someone who loved gardening built on and on.

## Fixed constraints (from the engine)

- **Logical grid:** 320×224 per screen, drawn at a fixed ×3 (stage 960×672, never scales). Tiles are **16×16** logical px. The camera scrolls, so a level is a large tile grid.
- **Palette:** DawnBringer 32 only (values in the attached `constants.ts`). In-between tones come from dithering between two DB32 tones, never a new hex.
- **Hard pixels:** no antialiasing, blur, alpha gradients, rotation or scaling.
- **Physics:** a jump climbs **2 tiles**, or **3** with a column of air before the ledge and nothing overhead. Ladders are climbable tiles. Doors are entities: press E to go through. Nothing else exists (no keys, switches, enemies or damage). Every place must be reachable from the entrance, and the entrance from every place.
- **Size:** about the Kitchen Garden's 170×72 tiles, and it may be taller than it is wide (for example 120 wide × 110 tall).

## The house, top to bottom (a starting point you can change)

- **Attic / eaves (top):** trunks, dust sheets, a rocking horse, moths around a skylight, a bedroom under the slope of the roof, a round window looking out over the garden roofs at dusk.
- **Upper floors (1–2):** a library-study of seed catalogues, a sewing or drying room hung with herbs, onions and lavender, a narrow landing with stairs and ladders.
- **Ground floor:** the cramped entrance (the shed), then a seed hall with walls of tiny drawers, a kitchen with a stove and a sleeping cat, and a pantry.
- **Basement:** an apple and root store, a preserves cellar, a boiler room with pipes.
- **Tunnels (bottom):** earth walls shored with timber, roots through the ceiling, a mole's chamber, a still underground pool, worms, and a far dead end with a landmark.

The route branches and loops: at least two ways between most floors (stairs, ladders, holes in the floor, a dumbwaiter shaft), plus a few optional nooks.

## Deliverables

1. **A cutaway map of the whole interior**, like a doll's-house cross-section, at tile scale (1 tile = 16 px, or a scaled-down version with the tile grid shown). It shows every room labelled, floors and walls as solid tiles, ladders, doorways, the entrance door, where each creature lives and where each landmark sits.
2. **The same map as ASCII rows** in the game's format, one character per tile, every row the same length. Use the existing legend:
   `.` air · `T` timber · `F` castle floor · `B` castle brick · `D` soil · `S` stone · `K` dark stone · `H` ladder · `W` water · `L` bookcase · `a` autumn turf · `U` puffball.
   If the house needs new tile kinds (wallpaper, floorboards, plank wall, packed earth, shored tunnel), propose each one with a letter, a 16×16 drawing and a recipe.
3. **A playable HTML prototype**: the entrance room → seed hall reveal, and one slice of the tunnels, with the figure walking and jumping at real speed. It should show how the "too big inside" moment reads on screen.
4. **Sprites and props**, drawn at game scale:
   - **Props:** stove, potting bench, drawers wall, grandfather clock, trunks, lamps and candles, hanging herbs, apple crates, pipes, roots.
   - **Creatures:** new ones as needed (spider on its thread, mole, worm, sleeping cat, moth), each with a small walk/idle cycle and a sketchbook portrait. Mouse, cat and bookworm already exist in the game, so restyle them only if needed.
   - **Landmarks:** 4–6, each with a short sketchbook text in the game's voice (calm, a little wry, one or two sentences). Suggestions: the Seed Catalogue, the Grandfather Clock, the Root Map, the Wrong-Size Window.
5. **Light rules:** the backdrop is dark indoors. Show how windows, lamps and the stove pool warm light, and how it gets darker the deeper you go.
6. **A README of recipes**: each new tile, prop and creature as plain pixel code with small primitives (`set`, `rect`, `dither(t)`, `vgrad`, `disc`, `ring`, `mix`). The game draws with PixiJS `Graphics.rect().fill()`, in the same style as `drawShed` (attached).

## Don't

- Don't change the shed's outside or its size: the gag depends on it.
- No new mechanics, combat or hazards.
- No colours outside DB32, and no smoothing.
- No scaling to the window.

## Attach

- The screenshot of the shed in the Kitchen Garden.
- `src/constants.ts` (DB32, grid).
- `src/world/levels/kitchen-garden.ts` (ASCII-row format, `drawShed`, how doors and spawns are declared).
- `src/world/tilemap.ts` (tile legend and tile drawing).
- `src/entities/player.ts` (the figure and its jump).
- `src/entities/mouse.ts`, `cat.ts`, `bookworm.ts` (existing indoor creatures).
- The stills in `design_brief_hd/stills/` for the overall look.
