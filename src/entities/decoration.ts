import { FLORA_NOTICE_RANGE_X, FLORA_NOTICE_RANGE_Y } from '@constants';
import type { FloraId } from '@entities/plants';
import { ArtBody } from '@hd/art-body';
import type { ClassicRecorder } from '@hd/classic-recorder';
import { type CritterLayers, plantHd } from '@hd/critter-hd';
import type { Vec2 } from '@types';
import type { Graphics } from 'pixi.js';

// A purely visual world element — tree, bush, rock, mushroom, etc. No state
// and nothing to press. Lives in the world container so it scrolls with the
// camera.
//
// Drawing convention matches Landmark: the spec draws around origin (0, 0)
// with the visible base sitting on the y=0 line; everything else extends
// into negative y. The Decoration just positions the Graphics at spec.x/y.
export interface DecorationSpec {
  x: number;
  y: number;
  // The species this is, when it is one of the six the flora book keeps a
  // page for. Absent on scenery with no page — the meadow's boulder and its
  // pebbles — which is the whole of the difference between the two.
  species?: FloraId;
  draw(g: Graphics): void;
  // Its own HD recipe (the potting shed's props take propHd); absent, a
  // plant takes the plant recipe and the rest of the scenery the common one.
  hd?: (recorded: ClassicRecorder) => CritterLayers;
}

export class Decoration {
  // Plants take the plant recipe, the rest of the scenery the common one;
  // identical drawings share their bake.
  readonly sprite: ArtBody;
  readonly species: FloraId | undefined;

  constructor(spec: DecorationSpec) {
    this.sprite = new ArtBody(spec.species ? 'plants' : spec.hd ? 'props' : 'scenery');
    this.sprite.x = spec.x;
    this.sprite.y = spec.y;
    this.species = spec.species;
    this.sprite.draw(spec.draw, spec.species ? plantHd : spec.hd);
  }

  // True if the player is close enough for the flora book to write this
  // plant's page. The same box test Landmark uses, with two differences:
  // it is anchored at the base rather than at mid-height — a plant is
  // noticed from the ground it grows out of, and they range from a 4-px
  // bush to a 30-px tree — and the box is wider, because nothing is pressed
  // here and walking the meadow end to end should fill most of the book.
  isPlayerInRange(playerPos: Vec2, playerSize: Vec2): boolean {
    const px = playerPos.x + playerSize.x / 2;
    const py = playerPos.y + playerSize.y / 2;
    return Math.abs(px - this.sprite.x) <= FLORA_NOTICE_RANGE_X && Math.abs(py - this.sprite.y) <= FLORA_NOTICE_RANGE_Y;
  }
}
