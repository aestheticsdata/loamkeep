import { ART_MODE, artMode, registerArt, setArtMode, unregisterArtUnder } from '@hd/art-mode';
import { Container } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';

const before = artMode();

afterEach(() => setArtMode(before));

// A pair inside `parent`, counting how often it is asked to refresh.
function pairIn(parent: Container) {
  const pair = { classic: new Container(), hd: new Container(), refreshes: 0, refresh: () => {} };
  pair.refresh = () => {
    pair.refreshes += 1;
  };
  const sprite = new Container();
  sprite.addChild(pair.classic, pair.hd);
  parent.addChild(sprite);
  registerArt(pair);
  return pair;
}

describe('art mode', () => {
  it('asks every drawing to bring the new art up to date when the mode changes', () => {
    const pair = pairIn(new Container());
    setArtMode(ART_MODE.classic);
    setArtMode(ART_MODE.hd);
    expect(pair.refreshes).toBe(2);
    expect(pair.hd.visible).toBe(true);
    expect(pair.classic.visible).toBe(false);
  });

  it('forgets the drawings inside a layer being emptied, and only those', () => {
    const level = new Container();
    const inLevel = pairIn(level);
    const elsewhere = pairIn(new Container());
    unregisterArtUnder(level);
    level.removeChildren();
    setArtMode(ART_MODE.classic);
    expect(inLevel.refreshes).toBe(0);
    expect(elsewhere.refreshes).toBe(1);
    // A forgotten pair is no longer flipped by the mode either.
    expect(inLevel.classic.visible).toBe(before === ART_MODE.classic);
  });
});
