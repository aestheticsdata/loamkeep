'use strict';
// Classic pieces, ported verbatim from the attached source (logical px, Graphics API).
const C = {};
C.figure = function (g, pose) {
  const cloak = D.lightSteel, cloakHi = D.white, cloakLo = D.heather, outline = D.valhalla, inside = D.valhalla, eye = D.twine, boots = D.heather, strap = D.dimGray;
  const {airborne, swimming, stepOffset, bodyBob} = pose;
  if (airborne || swimming) { g.rect(-2, -2, 2, 2).fill(boots); g.rect(0, -2, 2, 2).fill(boots); }
  else { g.rect(-3 + stepOffset, -2, 2, 2).fill(boots); g.rect(1 - stepOffset, -2, 2, 2).fill(boots); }
  g.rect(-5, -10 + bodyBob, 10, 8).fill(cloak); g.rect(-4, -10 + bodyBob, 8, 1).fill(cloakHi); g.rect(-4, -3 + bodyBob, 8, 1).fill(cloakLo);
  g.rect(-5, -10 + bodyBob, 1, 8).fill(outline); g.rect(4, -10 + bodyBob, 1, 8).fill(outline);
  g.rect(-4, -16 + bodyBob, 8, 6).fill(cloak); g.rect(-3, -16 + bodyBob, 6, 1).fill(cloakHi);
  g.rect(-4, -16 + bodyBob, 1, 6).fill(outline); g.rect(3, -16 + bodyBob, 1, 6).fill(outline);
  g.rect(-3, -15 + bodyBob, 6, 4).fill(inside);
  g.rect(1, -13 + bodyBob + (airborne ? -2 : 0), 1, 1).fill(eye);
  if (pose.climbing) { const high = pose.climbPhase === 1 ? 1 : 0; g.rect(-4, -14 - high, 1, 4).fill(strap); g.rect(3, -13 - (1 - high), 1, 4).fill(strap); }
  else if (swimming) { const f = 3 + Math.round(pose.swimPhase * 2), b = 3 - Math.round(pose.swimPhase * 2); for (let i = 0; i < f; i++) g.rect(2 + i, -7, 1, 1).fill(strap); for (let i = 0; i < b; i++) g.rect(-3 - i, -7, 1, 1).fill(strap); }
  else if (airborne) { g.rect(0, -10, 1, 1).fill(strap); g.rect(1, -11, 1, 1).fill(strap); g.rect(2, -12, 1, 1).fill(strap); g.rect(3, -13, 1, 1).fill(strap); }
  else { const dx = -stepOffset; g.rect(-4 + dx, -7 + bodyBob, 1, 1).fill(strap); g.rect(-3 + dx, -6 + bodyBob, 1, 1).fill(strap); g.rect(-2 + dx, -5 + bodyBob, 1, 1).fill(strap); g.rect(-1 + dx, -4 + bodyBob, 1, 1).fill(strap); }
};
C.snail = function (g, frame) {
  const shell = D.rope, stripe = D.twine;
  g.rect(-4, -1, 9, 1).fill(D.heather); g.rect(2, -3, 3, 2).fill(D.heather);
  g.rect(3, -5 - frame, 1, 2 + frame).fill(D.heather); g.rect(5, -5 + frame, 1, 2 - frame).fill(D.heather);
  g.rect(3, -6 - frame, 1, 1).fill(D.valhalla); g.rect(5, -6 + frame, 1, 1).fill(D.valhalla);
  g.rect(-4, -6, 6, 5).fill(shell); g.rect(-3, -7, 4, 1).fill(shell);
  g.rect(-3, -5, 4, 1).fill(stripe); g.rect(-3, -5, 1, 3).fill(stripe); g.rect(-3, -3, 3, 1).fill(stripe); g.rect(-1, -4, 1, 1).fill(stripe);
};
C.hare = function (g, pose) {
  const fur = D.white, furLo = D.heather, tip = D.valhalla;
  if (pose.bounding) {
    g.rect(-6, -6, 10, 4).fill(fur); g.rect(-6, -3, 10, 1).fill(furLo); g.rect(3, -8, 4, 4).fill(fur); g.rect(4, -12, 1, 4).fill(fur); g.rect(4, -12, 1, 1).fill(tip);
    g.rect(-7, -5, 1, 1).fill(fur); g.rect(-6, -2, 3, 2).fill(furLo); g.rect(2, -2, 3, 2).fill(furLo); g.rect(5, -7, 1, 1).fill(tip); return;
  }
  g.rect(-4, -8, 7, 8).fill(fur); g.rect(-5, -6, 1, 5).fill(fur); g.rect(-4, -1, 7, 1).fill(furLo); g.rect(-5, -3, 1, 1).fill(D.lightSteel); g.rect(1, -11, 5, 4).fill(fur);
  g.rect(2, -13 + pose.ear, 1, 3 - pose.ear).fill(fur); g.rect(2, -13 + pose.ear, 1, 1).fill(tip); g.rect(4, -14, 1, 4).fill(fur); g.rect(4, -14, 1, 1).fill(tip); g.rect(4, -10, 1, 1).fill(tip); g.rect(6, -9, 1, 1).fill(D.brown);
};
C.glowfish = function (g, fr) {
  const halo = D.viking, outer = 0.06 + fr.glow * 0.1, inner = 0.14 + fr.glow * 0.18;
  g.rect(-8, -6, 15, 9).fill({color: halo, alpha: outer}); g.rect(-6, -7, 11, 11).fill({color: halo, alpha: outer}); g.rect(-5, -4, 9, 5).fill({color: halo, alpha: inner});
  g.rect(-2, -2, 5, 2).fill(D.lightSteel); g.rect(-1, -3, 3, 1).fill(D.lightSteel); g.rect(-2, -1, 5, 1).fill(D.viking); g.rect(2, -2, 1, 1).fill(D.valhalla);
  g.rect(3, -4, 1, 1).fill(D.heather); g.rect(4, -5, 1, 1).fill(fr.glow > 0.5 ? D.white : D.viking);
  if (fr.tail === 0) g.rect(-3, -2, 1, 2).fill(D.heather); else { g.rect(-3, -2, 1, 1).fill(D.heather); g.rect(-4, -3, 1, 1).fill(D.heather); g.rect(-4, 0, 1, 1).fill(D.heather); }
};
C.glowfishLarge = function (g) {
  const halo = D.viking; g.rect(-14, -13, 28, 14).fill({color: halo, alpha: 0.12}); g.rect(-12, -11, 24, 10).fill({color: halo, alpha: 0.2});
  const b = D.lightSteel; g.rect(-6, -9, 12, 1).fill(b); g.rect(-7, -8, 14, 1).fill(b); g.rect(-8, -7, 16, 3).fill(b); g.rect(-7, -4, 14, 1).fill(b); g.rect(8, -7, 1, 2).fill(b);
  g.rect(-7, -5, 14, 1).fill(D.viking); g.rect(-6, -4, 12, 1).fill(D.viking); g.rect(-2, -11, 4, 2).fill(D.heather); g.rect(-1, -3, 3, 1).fill(D.heather);
  g.rect(-10, -8, 2, 4).fill(D.heather); g.rect(-11, -9, 1, 2).fill(D.heather); g.rect(-11, -5, 1, 2).fill(D.heather);
  g.rect(4, -8, 2, 2).fill(D.valhalla); g.rect(5, -8, 1, 1).fill(D.white); g.rect(6, -11, 1, 2).fill(D.heather); g.rect(7, -13, 1, 2).fill(D.heather); g.rect(8, -14, 2, 2).fill(D.white);
};
C.moth = function (g, f) {
  g.rect(-1, -3, 2, 2).fill(D.rope); g.rect(1, -4, 1, 1).fill(D.twine);
  if (f === 0) { g.rect(-3, -3, 2, 2).fill(D.pancho); g.rect(2, -3, 2, 2).fill(D.pancho); g.rect(-3, -2, 1, 1).fill(D.twine); g.rect(3, -2, 1, 1).fill(D.twine); }
  else { g.rect(-2, -4, 1, 2).fill(D.pancho); g.rect(2, -4, 1, 2).fill(D.pancho); }
};
C.mothLarge = function (g) {
  g.rect(-1, -8, 2, 7).fill(D.rope); g.rect(-3, -10, 1, 2).fill(D.rope); g.rect(2, -10, 1, 2).fill(D.rope); g.rect(-2, -9, 1, 1).fill(D.rope); g.rect(1, -9, 1, 1).fill(D.rope);
  g.rect(-7, -8, 6, 4).fill(D.pancho); g.rect(1, -8, 6, 4).fill(D.pancho); g.rect(-6, -4, 5, 3).fill(D.pancho); g.rect(1, -4, 5, 3).fill(D.pancho);
  g.rect(-7, -8, 6, 1).fill(D.twine); g.rect(1, -8, 6, 1).fill(D.twine);
  g.rect(-5, -6, 2, 2).fill(D.rope); g.rect(3, -6, 2, 2).fill(D.rope); g.rect(-5, -6, 1, 1).fill(D.valhalla); g.rect(4, -6, 1, 1).fill(D.valhalla);
};
// Meadow plants, verbatim from src/entities/plants.ts.
C.bush = function (g) { g.rect(-3, -4, 6, 4).fill(D.eltGreen); g.rect(-3, -4, 6, 1).fill(D.atlantis); g.rect(-4, -2, 1, 2).fill(D.eltGreen); g.rect(3, -2, 1, 2).fill(D.eltGreen); g.rect(-3, -1, 6, 1).fill(D.dell); };
C.smallTree = function (g) { g.rect(-1, -6, 2, 6).fill(D.oiledCedar); g.rect(-4, -10, 8, 4).fill(D.eltGreen); g.rect(-3, -13, 6, 3).fill(D.eltGreen); g.rect(-2, -15, 4, 2).fill(D.eltGreen); g.rect(-2, -15, 4, 1).fill(D.atlantis); g.rect(-3, -13, 1, 1).fill(D.atlantis); g.rect(2, -13, 1, 1).fill(D.atlantis); g.rect(-4, -7, 8, 1).fill(D.dell); };
C.pine = function (g) { g.rect(-1, -6, 2, 6).fill(D.oiledCedar); g.rect(-5, -10, 10, 4).fill(D.dell); g.rect(-5, -10, 10, 1).fill(D.eltGreen); g.rect(-4, -14, 8, 4).fill(D.dell); g.rect(-4, -14, 8, 1).fill(D.eltGreen); g.rect(-3, -18, 6, 4).fill(D.dell); g.rect(-3, -18, 6, 1).fill(D.eltGreen); g.rect(-1, -19, 2, 1).fill(D.eltGreen); };

// --- tiles (tilemap.ts) ---
const TILE = 16;
const T = {Empty:0, Grass:1, Dirt:2, Stone:3, Water:5, CastleBrick:6, CryptBrick:9, Ladder:14};
const TILE_COLORS = {[T.Grass]:D.eltGreen,[T.Dirt]:D.oiledCedar,[T.Stone]:D.heather,[T.Water]:D.venice,[T.CastleBrick]:D.dimGray,[T.CryptBrick]:SHIPPED.cryptWall};
C.grass = function (g, x, y, tx, ty) {
  g.rect(x, y, TILE, 1).fill(D.atlantis); g.rect(x, y + TILE - 3, TILE, 3).fill(D.dell);
  for (let i = 0; i < TILE; i += 2) g.rect(x + i, y + TILE - 4, 1, 1).fill(D.dell);
  for (let i = 0; i < 5; i++) g.rect(x + Math.floor(tileHash(tx, ty, 60 + i) * TILE), y + 2 + Math.floor(tileHash(tx, ty, 70 + i) * 8), 1, 1).fill(D.dell);
  for (let i = 0; i < 2; i++) g.rect(x + Math.floor(tileHash(tx, ty, 80 + i) * TILE), y + 1 + Math.floor(tileHash(tx, ty, 90 + i) * 6), 1, 1).fill(D.atlantis);
  const n = tileHash(tx, ty, 1) < 0.4 ? 3 : 4;
  for (let i = 0; i < n; i++) { const t0 = Math.floor(tileHash(tx, ty, 10 + i) * (TILE - 2)) + 1; g.rect(x + t0, y - 1, 1, 1).fill(D.atlantis); if (tileHash(tx, ty, 20 + i) < 0.3) g.rect(x + t0, y - 2, 1, 1).fill(D.atlantis); }
  if (tileHash(tx, ty, 100) < 0.2) { const fx = 1 + Math.floor(tileHash(tx, ty, 101) * (TILE - 2)); g.rect(x + fx, y - 1, 1, 1).fill(D.eltGreen); g.rect(x + fx, y - 2, 1, 1).fill(D.eltGreen); g.rect(x + fx, y - 3, 1, 1).fill(D.clairvoyant); if (tileHash(tx, ty, 102) < 0.5) g.rect(x + fx + 1, y - 3, 1, 1).fill(D.clairvoyant); }
};
C.dirt = function (g, x, y, tx, ty) {
  g.rect(x, y + 2 + Math.floor(tileHash(tx, ty, 70) * 10), TILE, 1).fill(D.loulou);
  for (let i = 0; i < 7; i++) g.rect(x + Math.floor(tileHash(tx, ty, 20 + i) * (TILE - 2)) + 1, y + Math.floor(tileHash(tx, ty, 30 + i) * (TILE - 2)) + 1, 1, 1).fill(D.loulou);
  for (let i = 0; i < 3; i++) g.rect(x + Math.floor(tileHash(tx, ty, 40 + i) * (TILE - 2)) + 1, y + Math.floor(tileHash(tx, ty, 50 + i) * (TILE - 2)) + 1, 1, 1).fill(D.rope);
  if (tileHash(tx, ty, 80) < 0.35) { const px = 2 + Math.floor(tileHash(tx, ty, 81) * (TILE - 6)), py = 4 + Math.floor(tileHash(tx, ty, 82) * (TILE - 8)); g.rect(x + px, y + py, 2, 2).fill(D.topaz); g.rect(x + px, y + py, 2, 1).fill(D.heather); }
};
function cBrick(g, gx, gy, tX, tY, base, hi, lo) { const x0 = Math.max(gx, tX), x1 = Math.min(gx + 8, tX + TILE), y0 = Math.max(gy, tY), y1 = Math.min(gy + 8, tY + TILE); if (x0 >= x1 || y0 >= y1) return; g.rect(x0, y0, x1 - x0, y1 - y0).fill(base); if (gy >= tY) g.rect(x0, gy, x1 - x0, 1).fill(hi); if (gx + 7 < tX + TILE) g.rect(gx + 7, y0, 1, y1 - y0).fill(lo); if (gy + 7 < tY + TILE) g.rect(x0, gy + 7, x1 - x0, 1).fill(lo); }
function cBrickPattern(g, x, y, ty, base, hi, lo) { for (let h = 0; h < 2; h++) { const by = y + h * 8, off = ((ty * 2 + h) & 1) === 0 ? 0 : 4, fx = Math.floor((x - off) / 8) * 8 + off; for (let bx = fx; bx < x + TILE; bx += 8) cBrick(g, bx, by, x, y, base, hi, lo); } }
C.stone = function (g, x, y, tx, ty) { cBrickPattern(g, x, y, ty, D.heather, D.lightSteel, D.dimGray); if (tileHash(tx, ty, 110) < 0.18) g.rect(x + 2 + Math.floor(tileHash(tx, ty, 111) * 12), y + 2 + Math.floor(tileHash(tx, ty, 112) * 12), 1, 1).fill(D.dimGray); };
C.castleBrick = function (g, x, y, tx, ty) { cBrickPattern(g, x, y, ty, D.dimGray, D.heather, D.valhalla); if (tileHash(tx, ty, 130) < 0.12) g.rect(x + 3 + Math.floor(tileHash(tx, ty, 131) * 10), y + 3 + Math.floor(tileHash(tx, ty, 132) * 10), 1, 1).fill(D.valhalla); };
C.cryptBrick = function (g, x, y, tx, ty) { cBrickPattern(g, x, y, ty, SHIPPED.cryptWall, SHIPPED.cryptHi, SHIPPED.cryptLo); if (tileHash(tx, ty, 150) < 0.08) g.rect(x + 2 + Math.floor(tileHash(tx, ty, 151) * 12), y + 2 + Math.floor(tileHash(tx, ty, 152) * 12), 1, 1).fill(D.white); };
C.ladder = function (g, x, y) { g.rect(x + 2, y, 2, TILE).fill(D.rope); g.rect(x + 12, y, 2, TILE).fill(D.rope); g.rect(x + 2, y, 1, TILE).fill(D.twine); g.rect(x + 12, y, 1, TILE).fill(D.twine); for (const ry of [3, 11]) { g.rect(x + 4, y + ry, 8, 1).fill(D.twine); g.rect(x + 4, y + ry + 1, 8, 1).fill(D.oiledCedar); } };
C.tile = function (g, t, x, y, tx, ty) {
  if (t === T.Ladder) return C.ladder(g, x, y);
  g.rect(x, y, TILE, TILE).fill(TILE_COLORS[t]);
  ({[T.Grass]:C.grass,[T.Dirt]:C.dirt,[T.Stone]:C.stone,[T.CastleBrick]:C.castleBrick,[T.CryptBrick]:C.cryptBrick})[t](g, x, y, tx, ty);
};
// water: surface tile (air above) or submerged
C.water = function (g, x, y, tx, ty, surface, off) {
  if (!surface) { g.rect(x, y, TILE, TILE).fill(D.venice); return; }
  g.rect(x, y + 6, TILE, 10).fill(D.venice);
  const sy = y + 2 + off; g.rect(x, sy, TILE, 1).fill(D.cornflower); g.rect(x, sy + 1, TILE, 1).fill(D.royalBlue);
  if (y + 6 > sy + 2) g.rect(x, sy + 2, TILE, y + 6 - (sy + 2)).fill(D.venice);
  if (tileHash(tx, ty, 200) < 0.3) g.rect(x + 2 + Math.floor(tileHash(tx, ty, 201) * 12), sy + 2, 1, 1).fill(D.lightSteel);
};

// --- parallax (parallax.ts) ---
function hillPoints(o) { const n = Math.floor(o.width / o.pointSpacing) + 1, p = []; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * o.width, t = i * o.frequency; const h = (Math.sin(t + o.seed) * 0.5 + Math.sin(t * 2.3 + o.seed * 1.7) * 0.3 + Math.sin(t * 4.1 + o.seed * 2.4) * 0.2) * 0.5 + 0.5; p.push([x, o.horizonY - h * o.maxHeight]); } return p; }
function ridgeAt(p, x) { if (x <= p[0][0]) return p[0][1]; for (let i = 1; i < p.length; i++) if (x <= p[i][0]) { const [ax, ay] = p[i - 1], [bx, by] = p[i]; return ay + (by - ay) * (x - ax) / (bx - ax); } return p[p.length - 1][1]; }
// Hard-edged raster of the poly(): a pixel is ink when its centre is under the ridge.
C.hills = function (g, o) { const p = hillPoints(o), base = o.baseY ?? o.horizonY; for (let x = 0; x < o.width; x++) { const r = ridgeAt(p, x + .5), y0 = Math.ceil(r - .5); g.rect(x, y0, 1, base - y0).fill(o.color); if (o.rimColor !== undefined) { const ry = Math.ceil(r - 1.5); g.rect(x, ry, 1, y0 - ry).fill(o.rimColor); } } };
const MEADOW_HILLS = w => [
  {width:w, horizonY:128, maxHeight:22, pointSpacing:48, frequency:0.4, seed:0.9, color:D.lightSteel, f:0.15},
  {width:w, horizonY:128, maxHeight:36, pointSpacing:32, frequency:0.5, seed:1.3, color:D.heather, rimColor:D.lightSteel, f:0.3},
  {width:w, horizonY:128, maxHeight:56, pointSpacing:16, frequency:0.8, seed:2.7, color:D.opal, rimColor:D.verdigris, f:0.6},
];
const NIGHT_HILLS = w => [
  {width:w, horizonY:204, baseY:604, maxHeight:28, pointSpacing:24, frequency:0.5, seed:4.1, color:SHIPPED.nightFar, f:0.15},
  {width:w, horizonY:218, baseY:604, maxHeight:20, pointSpacing:12, frequency:0.9, seed:0.6, color:SHIPPED.nightNear, f:0.3},
];
function starList(width, seed) { let s = seed; const next = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; const top = -40, bottom = 224 - 40, n = Math.floor((width * (bottom - top)) / 260), out = []; for (let i = 0; i < n; i++) { const x = Math.floor(next() * width), y = Math.floor(top + next() * (bottom - top)), bright = next() < 0.11; out.push({x, y, bright, c: bright ? D.white : (next() < 0.5 ? D.heather : D.topaz)}); } return out; }
C.stars = function (g, list) { for (const s of list) { if (s.bright) { g.rect(s.x, s.y, 1, 1).fill(D.white); g.rect(s.x - 1, s.y, 1, 1).fill(D.heather); g.rect(s.x + 1, s.y, 1, 1).fill(D.heather); g.rect(s.x, s.y - 1, 1, 1).fill(D.heather); g.rect(s.x, s.y + 1, 1, 1).fill(D.heather); } else g.rect(s.x, s.y, 1, 1).fill(s.c); } };
C.moon = function (g) { const cx = 252, cy = 38; const disc = (ox, r, c) => { for (let dy = -r; dy <= r; dy++) { const h = Math.round(Math.sqrt(r * r - dy * dy)); g.rect(cx + ox - h, cy + dy, h * 2 + 1, 1).fill(c); } }; disc(0, 12, D.deepKoamaru); disc(0, 10, D.lightSteel); disc(0, 9, D.pancho); disc(-6, 9, D.valhalla); g.rect(cx + 4, cy - 4, 2, 2).fill(D.twine); g.rect(cx + 6, cy + 3, 1, 1).fill(D.twine); };
C.nightSky = function (g) { g.rect(0, 0, 320, 224).fill(D.valhalla); g.rect(0, 168, 320, 56).fill(D.deepKoamaru); for (let x = 0; x < 320; x += 2) g.rect(x + ((x >> 1) & 1), 167, 1, 1).fill(D.deepKoamaru); };
