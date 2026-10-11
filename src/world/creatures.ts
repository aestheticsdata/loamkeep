import { DB32 } from '@constants';
import { drawBird } from '@entities/bird';
import { drawFishLarge } from '@entities/fish';
import { drawGlowfishLarge } from '@entities/glowfish';
import { drawMothLarge } from '@entities/moth';
import { drawOwl } from '@entities/owl';
import { drawPumpkin } from '@entities/pumpkin';
import { drawRabbit } from '@entities/rabbit';
import { type SketchbookPage, scaledSketch } from '@systems/sketchbook';

// The creatures sketchbook's table of contents: one page per species, in the
// order the wanderer is likely to meet them — the meadow's three, the one
// in the keep's garden, then the belfry's owl, the cistern's glowfish and the
// grotto's moth.
//
// Keyed by species, not by level. Meeting a rabbit is meeting rabbits, and the
// meadow has two of them; the ids are bare where the landmarks book's are
// '<level>.<landmark>', which the store does not care about either way.
//
// The pages are a record, never the event. The greeting popup is what fires
// when the player touches one — it lives in Game, next to the WorldState flag
// that stops it firing twice.
export type CreatureId = 'rabbit' | 'fish' | 'bird' | 'pumpkin' | 'owl' | 'glowfish' | 'moth';

export interface CreaturePage {
  id: CreatureId;
  page: SketchbookPage;
}

// The fish the page draws. The greeting shows whichever of the three the
// player actually bumped into; a page cannot, so it takes the first one the
// meadow puts in the water.
const PAGE_FISH_COLOR = DB32.tahitiGold;

// Descriptions are the wanderer's note about the creature, never the
// creature's own voice — that is the greeting's line, and the two must not
// read as the same thing. Observed, unexplained, no numbers.
export const CREATURE_PAGES: readonly CreaturePage[] = [
  {
    id: 'rabbit',
    page: {
      name: 'Rabbit',
      description:
        'Small, tan, and unbothered. It paces the same stretch of grass all day, ' +
        'and lets you walk right into it — which no wild thing should do.',
      drawSketch: scaledSketch((g) => drawRabbit(g, 0), 4, -10, 0),
    },
  },
  {
    id: 'fish',
    page: {
      name: 'Fish',
      description:
        'It hangs in the still water without seeming to swim, and then it is ' +
        'somewhere else. No two of them down there are the same colour.',
      drawSketch: scaledSketch((g) => drawFishLarge(g, PAGE_FISH_COLOR), 3, -10, 1),
    },
  },
  {
    id: 'bird',
    page: {
      name: 'Bird',
      description:
        'It crosses high up and never lands while anyone is watching. Caught ' +
        'mid-flap it is mostly wing, and the shape is wrong for this far inland.',
      drawSketch: scaledSketch((g) => drawBird(g, 1, DB32.valhalla), 8, -3, 0),
    },
  },
  {
    id: 'pumpkin',
    page: {
      name: 'Pumpkin',
      description:
        'A gourd the size of a fist, hopping. It keeps to its own row of the ' +
        'kitchen garden and turns back at the same two places, as though the ' +
        'ground ended there.',
      drawSketch: scaledSketch(drawPumpkin, 4, -8, 0),
    },
  },
  {
    id: 'owl',
    page: {
      name: 'Owl',
      description:
        'It sits on the beams of the belfry and lets you climb right past it. The head turns further round ' +
        'than a head should, and it blinks slowly, as though it had all night.',
      drawSketch: scaledSketch((g) => drawOwl(g, { blink: false, look: 0 }), 5, -11, 0),
    },
  },
  {
    id: 'glowfish',
    page: {
      name: 'Glowfish',
      description:
        'Pale enough to see through, and lit from inside with a cold blue light that comes and goes like ' +
        'breathing. Down in the cistern it is the only light there is, and it seems to know it.',
      drawSketch: scaledSketch(drawGlowfishLarge, 3, -14, 0),
    },
  },
  {
    id: 'moth',
    page: {
      name: 'Moth',
      description:
        'Pale, soft and never still, flying the same loop round the same glowcap until you could draw it. ' +
        'Two dark spots on its wings, like eyes, and it is the one doing the watching.',
      drawSketch: scaledSketch(drawMothLarge, 5, -10, 0),
    },
  },
];
