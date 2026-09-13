import type { LandmarkSpec } from '@entities/landmark';
import { Level, type LevelSpec } from '@world/level';
import { meadowLevel } from '@world/levels/meadow';
import { oldKeepLevel } from '@world/levels/old-keep';
import { oldKeepCryptLevel } from '@world/levels/old-keep-crypt';

// Registry of every authored level in the game. Keys are the string ids used
// by Door entities and (eventually) save data. Adding a new level is a
// two-line change: drop a `<name>.ts` in `world/levels/` exporting a
// LevelSpec, then import + register it here.
export type LevelId = 'meadow' | 'old-keep' | 'old-keep-crypt';

export const LEVEL_SPECS: Record<LevelId, LevelSpec> = {
  meadow: meadowLevel,
  'old-keep': oldKeepLevel,
  'old-keep-crypt': oldKeepCryptLevel,
};

// Default level loaded at game start. Currently the meadow — the player
// spawns on the grass with the existing tutorial flow.
export const STARTING_LEVEL_ID: LevelId = 'meadow';

// Build a fresh Level instance for the given id. Game calls this on every
// transition, which means the Tilemap is reparsed each time — cheap (parse
// is just a switch over ~30×60 chars) and keeps the data path uniform with
// future level-generation experiments.
export function loadLevel(id: string): Level {
  if (!(id in LEVEL_SPECS)) {
    throw new Error(`Unknown level id '${id}'. Known: ${Object.keys(LEVEL_SPECS).join(', ')}`);
  }
  return new Level(LEVEL_SPECS[id as LevelId]);
}

// Every landmark in the game, in registry order (meadow → keep → crypt, then
// authoring order inside each level). This is the sketchbook's table of
// contents: the title screen's page count and the gallery's page order both
// come from here, so adding a landmark to any level updates both for free.
export interface LandmarkPage {
  levelId: LevelId;
  spec: LandmarkSpec;
}

export function listLandmarkPages(): LandmarkPage[] {
  const pages: LandmarkPage[] = [];
  for (const levelId of Object.keys(LEVEL_SPECS) as LevelId[]) {
    for (const spec of LEVEL_SPECS[levelId].landmarks) {
      pages.push({ levelId, spec });
    }
  }
  return pages;
}
