import { drawFigureHd, figureHdPose } from '@entities/figure-hd';
import { drawFigure, type FigurePose } from '@entities/player';
import { record } from '@hd/classic-recorder';
import { footprint } from '@hd/footprint';
import { describe, expect, it } from 'vitest';

const rest: FigurePose = { airborne: false, swimming: false, stepOffset: 0, bodyBob: 0, swimPhase: 0 };

// Every classic pose the game can ask drawFigure for.
const POSES: Record<string, FigurePose> = {
  idle: rest,
  'walk +1': { ...rest, stepOffset: 1, bodyBob: -1 },
  'walk -1': { ...rest, stepOffset: -1, bodyBob: -1 },
  jump: { ...rest, airborne: true },
  'climb 0': { ...rest, climbing: true, climbPhase: 0 },
  'climb 1': { ...rest, climbing: true, climbPhase: 1 },
  'swim -1': { ...rest, swimming: true, swimPhase: -1 },
  'swim -0.5': { ...rest, swimming: true, swimPhase: -0.5 },
  'swim 0': { ...rest, swimming: true, swimPhase: 0 },
  'swim +0.5': { ...rest, swimming: true, swimPhase: 0.5 },
  'swim +1': { ...rest, swimming: true, swimPhase: 1 },
};

describe('the figure in HD keeps the classic footprint', () => {
  for (const [name, pose] of Object.entries(POSES)) {
    it(name, () => {
      expect(
        footprint(
          record((g) => drawFigure(g, pose)),
          drawFigureHd(figureHdPose(pose)),
        ),
      ).toBe(0);
    });
  }
});
