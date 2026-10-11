import { DB32, SCREEN_HEIGHT, SCREEN_WIDTH, textResolution } from '@constants';
import { type Input, KEYS_BACK, KEYS_DOWN, KEYS_INTERACT, KEYS_LEFT, KEYS_RIGHT, KEYS_UP } from '@systems/input';
import { drawPixelText, measurePixelText } from '@systems/pixel-font';
import { ATLAS, type AtlasPlace } from '@world/atlas';
import { Container, Graphics, Text } from 'pixi.js';

export type MapEvent = 'moved' | 'closed' | null;

// The sheet: parchment over the whole stage, a title, the places and the
// paths between them, and a box at the foot for the place in hand.
const PAPER = DB32.pancho;
const PAPER_DARK = DB32.twine;
const INK = DB32.oiledCedar;
const INK_FAINT = DB32.rope;
const TITLE = 'THE WORLD';
const BOX_Y = 160;
const BOX_H = 42;
const HINT = '← → choose a place    E close';
// Seconds per on/off of the ring round the place in hand.
const BLINK = 0.45;

// The world map, read from the title screen: every level, the path into each
// from the place it leads off, and — for whichever place is chosen — where
// exactly the way in is. Mirrors TitleSketchbook: Game shows it, feeds it
// input each frame, and hides it when it reports 'closed'.
export class WorldMap {
  readonly container: Container;

  private readonly ring: Graphics;
  private readonly box: Container;
  private index = 0;
  private clock = 0;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.addChild(drawSheet());
    this.ring = new Graphics();
    this.container.addChild(this.ring);
    this.box = new Container();
    this.container.addChild(this.box);
    const hint = smallText(HINT, INK_FAINT);
    hint.position.set(Math.round((SCREEN_WIDTH - hint.width) / 2), BOX_Y + BOX_H + 3);
    this.container.addChild(hint);
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  show(): void {
    this.index = 0;
    this.clock = 0;
    this.container.visible = true;
    this.select();
  }

  hide(): void {
    this.container.visible = false;
  }

  // One call per frame while open.
  update(input: Input, dt: number): MapEvent {
    if (input.isAnyPressed(KEYS_INTERACT) || input.isAnyPressed(KEYS_BACK)) return 'closed';
    this.clock += dt;
    this.ring.visible = Math.floor(this.clock / BLINK) % 2 === 0;
    let dir = 0;
    if (input.isAnyPressed(KEYS_LEFT) || input.isAnyPressed(KEYS_UP)) dir -= 1;
    if (input.isAnyPressed(KEYS_RIGHT) || input.isAnyPressed(KEYS_DOWN)) dir += 1;
    if (dir === 0) return null;
    this.index = (this.index + dir + ATLAS.length) % ATLAS.length;
    this.clock = 0;
    this.select();
    return 'moved';
  }

  // Ring the chosen place and write its name and its way in into the box.
  private select(): void {
    const place = ATLAS[this.index];
    this.ring.clear();
    this.ring.rect(place.x - 14, place.y - 12, 28, 23).stroke({ color: DB32.goldenFizz, width: 1 });
    this.ring.rect(place.x - 15, place.y - 13, 30, 25).stroke({ color: INK, width: 1 });
    this.ring.visible = true;

    for (const child of this.box.removeChildren()) child.destroy();
    const name = new Graphics();
    drawPixelText(name, place.label, 14, BOX_Y + 5, INK);
    this.box.addChild(name);
    const howTo = smallText(place.howTo, DB32.valhalla, SCREEN_WIDTH - 28);
    howTo.position.set(14, BOX_Y + 15);
    this.box.addChild(howTo);
  }
}

// The fixed part of the sheet, drawn once: paper, title, paths, places.
function drawSheet(): Container {
  const sheet = new Container();
  const g = new Graphics();
  g.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(PAPER);
  g.rect(3, 3, SCREEN_WIDTH - 6, SCREEN_HEIGHT - 6).stroke({ color: INK, width: 1 });
  g.rect(5, 5, SCREEN_WIDTH - 10, SCREEN_HEIGHT - 10).stroke({ color: INK_FAINT, width: 1 });
  drawPixelText(g, TITLE, Math.round((SCREEN_WIDTH - measurePixelText(TITLE)) / 2), 11, INK);
  // Paths first, so the pictures sit on top of them.
  for (const place of ATLAS) {
    if (place.from === undefined) continue;
    const from = ATLAS.find((p) => p.level === place.from);
    if (from !== undefined) drawPath(g, from, place);
  }
  // The box for the place in hand.
  g.rect(9, BOX_Y, SCREEN_WIDTH - 18, BOX_H).fill(PAPER_DARK);
  g.rect(9, BOX_Y, SCREEN_WIDTH - 18, BOX_H).stroke({ color: INK, width: 1 });
  sheet.addChild(g);
  for (const place of ATLAS) {
    const picture = new Graphics();
    picture.position.set(place.x, place.y);
    picture.rect(-12, -10, 24, 19).fill(PAPER_DARK);
    picture.rect(-12, -10, 24, 19).stroke({ color: INK, width: 1 });
    place.draw(picture);
    sheet.addChild(picture);
    const label = new Graphics();
    const labelX = Math.round(place.x - measurePixelText(place.label) / 2);
    // Paper behind the name, so a path running on past the place does not
    // strike through it.
    label.rect(labelX - 2, place.y + 11, measurePixelText(place.label) + 4, 11).fill(PAPER);
    drawPixelText(label, place.label, labelX, place.y + 13, INK);
    sheet.addChild(label);
  }
  return sheet;
}

// A dotted path between two places, the way a hand-drawn map marks a trail.
function drawPath(g: Graphics, a: AtlasPlace, b: AtlasPlace): void {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  for (let s = 0; s <= steps; s += 3) {
    const x = Math.round(a.x + ((b.x - a.x) * s) / steps);
    const y = Math.round(a.y + ((b.y - a.y) * s) / steps);
    g.rect(x, y, 2, 1).fill(INK_FAINT);
  }
}

function smallText(text: string, color: number, wrapWidth = 0): Text {
  const t = new Text({
    text,
    style: {
      fontFamily: 'monospace',
      fontSize: 7,
      fill: color,
      wordWrap: wrapWidth > 0,
      wordWrapWidth: wrapWidth,
      lineHeight: 8,
    },
  });
  t.resolution = textResolution();
  return t;
}
