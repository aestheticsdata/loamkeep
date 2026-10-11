import { PLANTS } from '@entities/plants';
import { record } from '@hd/classic-recorder';
import { plantHd } from '@hd/critter-hd';
import { footprintDiff } from '@hd/footprint';
import { describe, expect, it } from 'vitest';

describe('every plant in HD keeps its classic footprint', () => {
  for (const [name, plant] of Object.entries(PLANTS)) {
    it(name, () => {
      const recorded = record(plant.draw);
      expect(footprintDiff(recorded, plantHd(recorded).body)).toEqual([]);
    });
  }
});
