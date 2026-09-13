import { DB32, renderResolution, SCREEN_HEIGHT, SCREEN_WIDTH, stageScale, textResolution } from '@constants';
import { Game } from '@game';
import { Application, type Container, Text, TextureStyle } from 'pixi.js';

async function main(): Promise<void> {
  // The only textures in the game are rasterised Text (the world is all
  // Graphics). They are drawn 1:1 at textResolution(), so this only matters
  // after a zoom change re-scales an existing one — and then it must scale
  // like the rest of the pixel art, nearest-neighbour. Must be set before any
  // texture exists: Pixi reads it when it creates the texture.
  TextureStyle.defaultOptions.scaleMode = 'nearest';

  // The scale the stage is at right now. Read once here and kept, so the
  // resize handler can tell a real change from a resize that moved nothing.
  let scale = stageScale();

  const app = new Application();
  await app.init({
    width: SCREEN_WIDTH * scale,
    height: SCREEN_HEIGHT * scale,
    background: DB32.cornflower,
    antialias: false,
    roundPixels: true,
    // Draw at the device's pixel ratio; autoDensity keeps the canvas at
    // SCREEN_* x scale CSS px. One backing pixel per device pixel means the
    // browser never resamples the canvas. The old fixed 960-px backing store
    // relied on `image-rendering: pixelated` for the upscale, and Chrome
    // quietly falls back to smooth filtering the moment the CSS size is
    // smaller than the backing store — any zoom under 100 % — which blurred
    // the whole game and smeared the title's text shadows into a double image.
    resolution: renderResolution(),
    autoDensity: true,
  });

  // All gameplay is authored in 320x224 logical space; the stage upscales it.
  app.stage.scale.set(scale);

  // A resize asks two questions, and either can be the one that changed: how
  // many CSS pixels the window can give a logical one now (browser zoom moves
  // this too, since it moves innerWidth), and how many device pixels a CSS one
  // is worth. Nothing to do when both answers are the same as last frame —
  // a window dragged 40 px wider usually changes neither.
  window.addEventListener('resize', () => {
    const dpr = renderResolution();
    const next = stageScale();
    if (next === scale && app.renderer.resolution === dpr) return;

    scale = next;
    app.stage.scale.set(scale);
    app.renderer.resize(SCREEN_WIDTH * scale, SCREEN_HEIGHT * scale, dpr);
    // Every glyph already on the stage was rasterised for the old scale, and
    // a raster scaled by anything is the blur this game spends its whole
    // render path avoiding. Text is cheap; redo it.
    rasteriseText(app.stage);
  });

  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('No #app element in index.html');
  appEl.appendChild(app.canvas);

  // Hide the mouse cursor over the canvas. Two layered defenses:
  //   1. inline `style.cursor = 'none'` + a matching CSS rule in index.html
  //   2. Pixi's EventSystem default cursor (re-applied on every pointer event)
  //
  // Known limitation: browsers don't re-evaluate the canvas's `cursor` rule
  // until the user's first real mouse movement, so on a fresh page load the
  // default cursor stays visible briefly until they move the mouse. We tried
  // forcing a refresh via a synthetic mousemove; modern browsers don't honor
  // it for cursor purposes. Living with this rather than hiding the cursor
  // across the whole page.
  app.canvas.style.cursor = 'none';
  app.renderer.events.cursorStyles.default = 'none';

  const game = new Game(app);
  game.start();

  // The demo harness's one window onto the game — see e2e/demo/README.md. A
  // storyboard that can read where the player is waits for *the player reached
  // the door* instead of holding a key for a guessed number of milliseconds and
  // hoping the jump landed, and a missed jump is a wasted take. `DEV` is a
  // compile-time constant, so the production bundle carries neither the branch
  // nor the property.
  if (import.meta.env.DEV) {
    (window as unknown as { __loamkeep?: () => unknown }).__loamkeep = () => game.snapshot();
  }

  console.log('Loamkeep — phase 2 running.');
}

// Re-rasterise every Text under `node` for the scale the stage is at now.
// Pixi rebuilds the texture when `resolution` is assigned, so this is the
// whole of it.
function rasteriseText(node: Container): void {
  if (node instanceof Text) node.resolution = textResolution();
  for (const child of node.children) rasteriseText(child as Container);
}

main().catch((err) => {
  console.error(err);
});
