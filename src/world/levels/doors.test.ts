import { Door } from '@entities/door';
import { ART_MODE, setArtMode } from '@hd/art-mode';
import { LEVEL_SPECS, type LevelId, loadLevel } from '@world/levels';
import { describe, expect, it } from 'vitest';

// Building a level's entities draws them: in classic, which needs no canvas.
setArtMode(ART_MODE.classic);

const noop = () => {};
const context = {
  transitionTo: noop,
  worldState: { get: () => false, set: noop },
  audio: new Proxy({}, { get: () => noop }),
} as never;

// Every door in the game leads to a spawn that exists: a level rebuilt with a
// spawn renamed or dropped breaks the doors of the levels around it, and only
// at the moment someone walks through one.
describe('every door', () => {
  for (const id of Object.keys(LEVEL_SPECS) as LevelId[]) {
    it(`in ${id} lands on a spawn that exists`, () => {
      const doors = loadLevel(id)
        .spec.createEntities(context)
        .filter((e): e is Door => e instanceof Door);
      const lost = doors
        .filter((d) => {
          try {
            loadLevel(d.spec.targetLevelId).spawn(d.spec.targetSpawnId);
            return false;
          } catch {
            return true;
          }
        })
        .map((d) => `${d.spec.id} -> ${d.spec.targetLevelId} '${d.spec.targetSpawnId}'`);
      expect(lost).toEqual([]);
    });
  }
});
