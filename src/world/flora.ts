import { type FloraId, PLANTS } from '@entities/plants';
import { type SketchbookPage, scaledSketch } from '@systems/sketchbook';
import type { Graphics } from 'pixi.js';

// The flora sketchbook's table of contents: one page per species, largest
// tree last, then the two things that grow under them.
//
// Authored rather than derived, like the creatures book — a species is not
// registered anywhere the way a landmark is registered on a level, and one
// page covers however many of the thing the world holds: the same oak stands
// at two columns, and there are four mushrooms down in the cavern.
//
// The pages are a record, never the event. What writes one is walking near
// the plant — no key, no popup — which lives in Game next to the other
// per-frame checks.
export interface FloraPage {
  id: FloraId;
  page: SketchbookPage;
}

// The four trees are drawn to one scale, so a leaf of this book says how they
// stand against each other and not merely what each one looks like: the
// sapling really is half the pine, the great oak really does double the
// sapling. The scale is the largest that keeps the great oak clear of the
// footer. Bush and mushroom would be a smear at it, so the understorey gets
// its own — a field guide draws the small things larger too.
const TREE_SCALE = 2;
const UNDERSTOREY_SCALE = 6;

// A plant enlarged onto a leaf. Its ink runs from -height to the base line by
// the drawing convention, so the extents come from the species itself and
// never have to be restated here.
function plantSketch(id: FloraId, scale: number): (g: Graphics) => void {
  const plant = PLANTS[id];
  return scaledSketch(plant.draw, scale, -plant.height, 0);
}

// Descriptions are the wanderer's note on the thing, in the same voice as the
// creatures book: observed, unexplained, no numbers. A plant says nothing
// back, so there is no second voice to keep these apart from.
export const FLORA_PAGES: readonly FloraPage[] = [
  {
    id: 'small-tree',
    page: {
      name: 'Sapling',
      description:
        'Young enough that the crown is still one round shape. It stands in ' +
        'the open, where a seed had no business landing.',
      drawSketch: plantSketch('small-tree', TREE_SCALE),
    },
  },
  {
    id: 'pine-tree',
    page: {
      name: 'Pine',
      description:
        'Dark and stiff, holding its tiers apart like something built rather ' +
        'than grown. It keeps its colour after the others go grey.',
      drawSketch: plantSketch('pine-tree', TREE_SCALE),
    },
  },
  {
    id: 'tall-oak',
    page: {
      name: 'Oak',
      description:
        'Broad at the shoulder, with roots that flare into the grass before ' +
        'they go under. One side of the trunk is always the lighter.',
      drawSketch: plantSketch('tall-oak', TREE_SCALE),
    },
  },
  {
    id: 'giant-tree',
    page: {
      name: 'Great Oak',
      description:
        'It carries its canopy over everything else on the meadow. There is a ' +
        'knot in the trunk at eye height, darker than bark should be.',
      drawSketch: plantSketch('giant-tree', TREE_SCALE),
    },
  },
  {
    id: 'bush',
    page: {
      name: 'Bush',
      description:
        'Low, dense, and impossible to see into. Something moves in one of them ' +
        'as you pass and has stopped by the time you turn.',
      drawSketch: plantSketch('bush', UNDERSTOREY_SCALE),
    },
  },
  {
    id: 'mushroom',
    page: {
      name: 'Mushroom',
      description:
        'It grows out of bare stone where nothing reaches it. The spots on ' +
        'the cap are the only white left down there.',
      drawSketch: plantSketch('mushroom', UNDERSTOREY_SCALE),
    },
  },
];
