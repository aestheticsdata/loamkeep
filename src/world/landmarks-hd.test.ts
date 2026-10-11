import { DB32 } from '@constants';
import { record } from '@hd/classic-recorder';
import { critterHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import { LEVEL_SPECS, type LevelId, loadLevel } from '@world/levels';
import { describe, expect, it } from 'vitest';

// The same lights landmark.ts leaves lit.
const LIGHTS = [DB32.goldenFizz, DB32.white, DB32.viking, DB32.tahitiGold];

describe('every landmark in HD keeps its classic footprint', () => {
  for (const id of Object.keys(LEVEL_SPECS) as LevelId[]) {
    for (const landmark of loadLevel(id).spec.landmarks) {
      it(`${id} / ${landmark.id}`, () => {
        const recorded = record((g) => landmark.drawBody(g, false));
        expect(footprintDiff(recorded, critterHd(recorded, { emissive: LIGHTS }).body)).toEqual([]);
      });
    }
  }
});
