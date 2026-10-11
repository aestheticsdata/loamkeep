'use strict';
// The Potting Shed's art. Classic pieces are logical-px Graphics code (the game's
// style, like drawShed); every HD piece is derived from them by the laws of the
// HD pass (README §1) plus the per-piece details below.
RAMP.set(D.tahitiGold, [D.twine, D.rope]); RAMP.set(D.smokeyAsh, [D.mandy, D.loulou]); RAMP.set(D.rainforest, [D.plum, D.stinger]);
const discL = (g, cx, cy, r, c) => { for (let dy = -r; dy <= r; dy++) { const h = Math.round(Math.sqrt(r * r - dy * dy)); g.rect(cx - h, cy + dy, h * 2 + 1, 1).fill(c); } };

// ===================================================================== existing pieces (verbatim)
C.timber = function (g, x, y, tx, ty) { g.rect(x, y, 16, 16).fill(D.oiledCedar); g.rect(x, y, 16, 2).fill(D.rope); g.rect(x, y, 16, 1).fill(D.twine); g.rect(x, y + 14, 16, 2).fill(D.valhalla); const a = 2 + Math.floor(tileHash(tx, ty, 160) * 6), b = 1 + Math.floor(tileHash(tx, ty, 161) * 6); g.rect(x + a, y + 5, 16 - a - 2, 1).fill(D.loulou); g.rect(x + b, y + 9, 16 - b - 4, 1).fill(D.loulou); if (tileHash(tx, ty, 162) < 0.5) g.rect(x, y + 2, 1, 12).fill(D.valhalla); if (tileHash(tx, ty, 163) < 0.25) g.rect(x + 7, y + 3, 2, 2).fill(D.twine); };
const SPINES = [D.clairvoyant, D.eltGreen, D.deepKoamaru, D.rainforest, D.venice, D.loulou, D.dell, D.brown];
function spines(tx, ty) { const out = []; let cx = 1, i = 0; while (cx < 15) { const w = 1 + Math.floor(tileHash(tx * 7 + i, ty, 200) * 2), top = 2 + Math.floor(tileHash(tx * 7 + i, ty, 201) * 4), c = SPINES[Math.floor(tileHash(tx * 7 + i, ty, 202) * 8)]; out.push({x: cx, w: Math.min(w, 15 - cx), top, c}); cx += w + (tileHash(tx * 7 + i, ty, 203) < 0.15 ? 1 : 0); i++; } return out; }
C.bookcase = function (g, x, y, tx, ty) { g.rect(x, y, 16, 16).fill(D.oiledCedar); g.rect(x, y + 1, 16, 13).fill(D.valhalla); for (const s of spines(tx, ty)) { g.rect(x + s.x, y + s.top, s.w, 13 - s.top).fill(s.c); g.rect(x + s.x, y + s.top, s.w, 1).fill(D.pancho); } g.rect(x, y + 14, 16, 2).fill(D.rope); g.rect(x, y, 16, 1).fill(D.twine); };
C.darkStone = function (g, x, y, tx, ty) { g.rect(x, y, 16, 16).fill(D.topaz); cBrickPattern(g, x, y, ty, D.topaz, D.heather, D.valhalla); };
C.cat = function (g, p) { const fur = D.tahitiGold, dk = D.rope; if (p.stretching) { g.rect(-9, -4, 14, 3).fill(fur); g.rect(5, -2, 4, 2).fill(fur); g.rect(-12, -6, 4, 4).fill(fur); g.rect(-12, -8, 1, 2).fill(fur); g.rect(-9, -8, 1, 2).fill(fur); g.rect(-11, -5, 1, 1).fill(D.valhalla); g.rect(-6, -4, 1, 3).fill(dk); g.rect(0, -4, 1, 3).fill(dk); g.rect(9, -6, 1, 4).fill(fur); return; } g.rect(-6, -5, 12, 5).fill(fur); g.rect(-5, -6, 10, 1).fill(fur); g.rect(-3, -5, 1, 4).fill(dk); g.rect(1, -5, 1, 4).fill(dk); g.rect(-8, -6, 5, 5).fill(fur); g.rect(-8, -8, 1, 2).fill(fur); g.rect(-5, -8, 1, 2).fill(fur); g.rect(-7, -4, 2, 1).fill(D.valhalla); g.rect(-8, -2, 1, 1).fill(D.mandy); g.rect(-4, -1, 11, 1).fill(dk); g.rect(7, -2 - p.flick, 1, 2).fill(dk); };
C.mouse = function (g, w) { const fur = D.topaz; g.rect(-8, -1, 4, 1).fill(D.mandy); g.rect(-4, -4, 6, 4).fill(fur); g.rect(2, -3, 2, 3).fill(fur); g.rect(4, -2, 1, 1).fill(D.mandy); g.rect(0, -6, 2, 2).fill(D.heather); g.rect(1, -5, 1, 1).fill(D.mandy); g.rect(2, -3, 1, 1).fill(D.valhalla); g.rect(4, -3 - w, 2, 1).fill(D.lightSteel); g.rect(-3, -1, 1, 1).fill(D.heather); };
C.bookworm = function (g, f) { const b = D.atlantis; if (f === 1) { g.rect(-4, -1, 2, 1).fill(b); g.rect(-2, -3, 3, 2).fill(b); g.rect(1, -1, 2, 1).fill(b); g.rect(3, -3, 2, 3).fill(b); } else { g.rect(-5, -1, 9, 1).fill(b); g.rect(3, -3, 2, 3).fill(b); } g.rect(4, -3, 1, 1).fill(D.white); g.rect(5, -3, 1, 1).fill(D.valhalla); };

// ===================================================================== new tiles (classic)
// f  Floorboards — a floor seen in cross-section: boards on top (where air is above),
//    joists in the void, lath-and-plaster under it (where air is below). Neighbour-aware.
C.floorboards = function (g, x, y, tx, ty, nb) {
  g.rect(x, y, 16, 16).fill(D.loulou);
  g.rect(x + (tx & 1 ? 2 : 10), y + 5, 3, 8).fill(D.oiledCedar);
  if (nb.up) { g.rect(x, y, 16, 4).fill(D.rope); g.rect(x, y, 16, 1).fill(D.twine); g.rect(x, y + 4, 16, 1).fill(D.oiledCedar); g.rect(x + (tileHash(tx, ty, 600) < 0.5 ? 5 : 11), y + 1, 1, 3).fill(D.oiledCedar); if (tileHash(tx, ty, 601) < 0.4) g.rect(x + 2, y + 2, 1, 1).fill(D.topaz); }
  if (nb.down) { g.rect(x, y + 13, 16, 3).fill(D.twine); g.rect(x, y + 13, 16, 1).fill(D.rope); }
};
// j  Plank wall — the house's walls and the mass between rooms: 4-px boards, lit left edge.
C.plankWall = function (g, x, y, tx, ty) { g.rect(x, y, 16, 16).fill(D.oiledCedar); for (let i = 0; i < 16; i += 4) { g.rect(x + i, y, 1, 16).fill(D.loulou); g.rect(x + i + 1, y, 1, 16).fill(D.rope); if (tileHash(tx * 4 + i, ty, 610) < 0.25) g.rect(x + i + 2, y + 3, 1, 1).fill(D.twine); } };
// e  Packed earth — darker than the garden's soil, with clods and the odd stone.
C.packedEarth = function (g, x, y, tx, ty) { g.rect(x, y, 16, 16).fill(D.loulou); for (let i = 0; i < 5; i++) g.rect(x + Math.floor(tileHash(tx, ty, 620 + i) * 14), y + Math.floor(tileHash(tx, ty, 630 + i) * 15), 2, 1).fill(D.oiledCedar); for (let i = 0; i < 3; i++) g.rect(x + Math.floor(tileHash(tx, ty, 640 + i) * 15), y + Math.floor(tileHash(tx, ty, 650 + i) * 15), 1, 1).fill(D.valhalla); if (tileHash(tx, ty, 660) < 0.25) { const px = x + 3 + Math.floor(tileHash(tx, ty, 661) * 9), py = y + 3 + Math.floor(tileHash(tx, ty, 662) * 9); g.rect(px, py, 2, 2).fill(D.topaz); g.rect(px, py, 1, 1).fill(D.heather); } };
// r  Root earth — packed earth over a tunnel; roots hang out of its underside into the air below.
C.rootEarth = function (g, x, y, tx, ty) { C.packedEarth(g, x, y, tx, ty); for (let i = 0; i < 2; i++) { const rx = x + 2 + Math.floor(tileHash(tx, ty, 670 + i) * 12), len = 2 + Math.floor(tileHash(tx, ty, 672 + i) * 5); g.rect(rx, y + 10, 1, 6 + len).fill(D.rope); g.rect(rx, y + 16 + len, 1, 1).fill(D.twine); if (len > 3) g.rect(rx + 1, y + 17, 1, 2).fill(D.rope); } };
C.shedTile = function (g, ch, x, y, tx, ty, nb) {
  switch (ch) {
    case 'j': return C.plankWall(g, x, y, tx, ty); case 'f': return C.floorboards(g, x, y, tx, ty, nb);
    case 'T': return C.timber(g, x, y, tx, ty); case 'L': return C.bookcase(g, x, y, tx, ty);
    case 'e': return C.packedEarth(g, x, y, tx, ty); case 'r': return C.rootEarth(g, x, y, tx, ty);
    case 'K': return C.darkStone(g, x, y, tx, ty); case 'H': return C.ladder(g, x, y);
    case 'W': return C.water(g, x, y, tx, ty, nb.up, 0);
  }
};

// ===================================================================== new tiles (HD)
H.timber = function (S, X, Y, tx, ty) {
  S.rect(X, Y, 48, 48, D.oiledCedar).rect(X, Y, 48, 2, D.twine).dither(X, Y + 2, 48, 1, D.rope, D.twine, .5).rect(X, Y + 3, 48, 3, D.rope).rect(X, Y + 42, 48, 2, D.loulou).rect(X, Y + 44, 48, 4, D.valhalla);
  const a = 2 + Math.floor(tileHash(tx, ty, 160) * 6), b = 1 + Math.floor(tileHash(tx, ty, 161) * 6);
  S.rect(X + 3 * a, Y + 15, 48 - 3 * a - 6, 2, D.loulou).rect(X + 3 * a, Y + 14, 48 - 3 * a - 6, 1, D.rope).rect(X + 3 * b, Y + 27, 48 - 3 * b - 12, 2, D.loulou).rect(X + 3 * b, Y + 26, 48 - 3 * b - 12, 1, D.rope);
  if (tileHash(tx, ty, 162) < 0.5) S.rect(X, Y + 6, 2, 36, D.valhalla).rect(X + 2, Y + 6, 1, 36, D.rope);
  if (tileHash(tx, ty, 163) < 0.25) S.disc(X + 24, Y + 12, 3, D.twine).set(X + 25, Y + 13, D.rope).set(X + 23, Y + 10, D.pancho);
};
H.bookcase = function (S, X, Y, tx, ty) {
  S.rect(X, Y, 48, 48, D.oiledCedar).rect(X, Y + 3, 48, 39, D.valhalla).dither(X, Y + 3, 48, 6, null, D.black, .5);
  for (const s of spines(tx, ty)) { const x = X + 3 * s.x, w = 3 * s.w, y = Y + 3 * s.top, h = 39 - 3 * s.top + 3; S.rect(x, y, w, h, s.c).rect(x, y, w, 2, D.pancho).rect(x + w - 1, y + 2, 1, h - 2, loOf(s.c)).rect(x, y + 2, 1, h - 2, hiOf(s.c)); S.rect(x + 1, y + Math.floor(h / 3), w - 2, 2, D.twine); }
  S.rect(X, Y + 42, 48, 6, D.rope).rect(X, Y + 42, 48, 1, D.twine).rect(X, Y + 46, 48, 2, D.oiledCedar).rect(X, Y, 48, 3, D.twine).rect(X, Y + 2, 48, 1, D.rope);
};
H.darkStone = (S, X, Y) => brick(S, X, Y, {base: D.topaz, hi: D.heather, mid: D.dimGray, lo: D.valhalla}, true);
H.floorboards = function (S, X, Y, tx, ty, nb) {
  S.rect(X, Y, 48, 48, D.loulou).dither(X, Y, 48, 48, null, D.valhalla, .25);
  const jx = X + (tx & 1 ? 6 : 30); S.rect(jx, Y + 15, 9, 24, D.oiledCedar).rect(jx, Y + 15, 1, 24, D.rope).rect(jx + 8, Y + 15, 1, 24, D.loulou);
  if (nb.up) {
    S.rect(X, Y, 48, 2, D.twine).dither(X, Y + 2, 48, 1, D.rope, D.twine, .5).rect(X, Y + 3, 48, 9, D.rope).rect(X, Y + 12, 48, 2, D.oiledCedar).rect(X, Y + 14, 48, 1, D.loulou);
    for (let i = 0; i < 3; i++) { const gx = X + Math.floor(tileHash(tx, ty, 700 + i) * 40), gy = Y + 5 + Math.floor(tileHash(tx, ty, 703 + i) * 5); S.rect(gx, gy, 6 + i * 2, 1, D.oiledCedar); }
    const j = X + 3 * (tileHash(tx, ty, 600) < 0.5 ? 5 : 11); S.rect(j, Y + 3, 2, 9, D.oiledCedar).rect(j - 1, Y + 3, 1, 9, D.twine);
    if (tileHash(tx, ty, 601) < 0.4) S.rect(X + 6, Y + 6, 2, 2, D.topaz).set(X + 6, Y + 6, D.heather);
  }
  if (nb.down) S.rect(X, Y + 39, 48, 2, D.rope).rect(X, Y + 41, 48, 7, D.twine).dither(X, Y + 45, 48, 3, null, D.pancho, .25);
};
H.plankWall = function (S, X, Y, tx, ty) {
  for (let i = 0; i < 4; i++) { const x = X + i * 12; S.rect(x, Y, 12, 48, D.oiledCedar).rect(x, Y, 2, 48, D.loulou).rect(x + 2, Y, 1, 48, D.rope);
    for (let k = 0; k < 2; k++) { const gy = Y + Math.floor(tileHash(tx * 4 + i, ty, 680 + k) * 44); S.rect(x + 5 + k * 3, gy, 1, 4, D.loulou).rect(x + 4 + k * 3, gy, 1, 4, D.rope); }
    if (tileHash(tx * 4 + i, ty, 610) < 0.25) S.rect(x + 6, Y + 9, 2, 2, D.twine).set(x + 7, Y + 10, D.rope); }
};
H.packedEarth = function (S, X, Y, tx, ty) {
  S.rect(X, Y, 48, 48, D.loulou);
  for (let i = 0; i < 14; i++) { const x = X + Math.floor(tileHash(tx, ty, 720 + i) * 42), y = Y + 1 + Math.floor(tileHash(tx, ty, 740 + i) * 44); S.rect(x, y, 6, 2, D.oiledCedar).rect(x + 1, y - 1, 4, 1, D.rope); }
  for (let i = 0; i < 9; i++) S.rect(X + Math.floor(tileHash(tx, ty, 760 + i) * 46), Y + Math.floor(tileHash(tx, ty, 770 + i) * 46), 2, 1, D.valhalla);
  if (tileHash(tx, ty, 660) < 0.25) { const px = X + 9 + Math.floor(tileHash(tx, ty, 661) * 27), py = Y + 9 + Math.floor(tileHash(tx, ty, 662) * 27); S.rect(px, py + 6, 6, 1, D.valhalla).disc(px + 3, py + 3, 3.2, D.topaz).rect(px + 1, py, 3, 1, D.heather).rect(px, py + 1, 1, 2, D.heather).rect(px + 2, py + 5, 3, 1, D.dimGray); }
};
H.rootEarth = function (S, X, Y, tx, ty) {
  H.packedEarth(S, X, Y, tx, ty);
  for (let i = 0; i < 2; i++) { const rx = X + 3 * (2 + Math.floor(tileHash(tx, ty, 670 + i) * 12)), len = 3 * (2 + Math.floor(tileHash(tx, ty, 672 + i) * 5));
    for (let k = 30; k < 48 + len; k++) { const wob = Math.round(Math.sin((k + rx) * 0.35)); S.rect(rx + wob, Y + k, 2, 1, D.rope).set(rx + wob, Y + k, D.twine); }
    S.set(rx, Y + 48 + len, D.twine); if (len > 9) S.rect(rx + 2, Y + 51, 2, 1, D.rope).rect(rx + 3, Y + 52, 1, 4, D.rope); }
};
H.shedTile = function (S, ch, X, Y, tx, ty, nb) {
  switch (ch) {
    case 'j': return H.plankWall(S, X, Y, tx, ty); case 'f': return H.floorboards(S, X, Y, tx, ty, nb);
    case 'T': return H.timber(S, X, Y, tx, ty); case 'L': return H.bookcase(S, X, Y, tx, ty);
    case 'e': return H.packedEarth(S, X, Y, tx, ty); case 'r': return H.rootEarth(S, X, Y, tx, ty);
    case 'K': return H.darkStone(S, X, Y, tx, ty); case 'H': return H.ladder(S, X, Y);
    case 'W': return H.water(S, X, Y, tx, ty, nb.up, nb.depth, 0, 0, 0);
  }
};

// ===================================================================== backdrops (HD, world-aligned fine px)
// Rule: a backdrop is the foreground's material one ramp step down, so anything you can stand on reads in front of it.
const hb = (a, b, s) => tileHash(a, b, s);
const BD = {
  shed(x, y) { const bx = ((x % 24) + 24) % 24, b = Math.floor(x / 24); if (bx < 2) return D.valhalla; if (bx === 2) return D.oiledCedar; if ((bx === 8 || bx === 15) && hb(b, Math.floor(y / 18), 800) < .35) return D.valhalla; return D.loulou; },
  drawers(x, y) { const cx = ((x % 24) + 24) % 24, cy = ((y % 18) + 18) % 18, i = Math.floor(x / 24), j = Math.floor(y / 18); if (cx < 2 || cy < 2) return D.valhalla; if (hb(i, j, 810) < .07 && cy < 4) return D.black; if (cy === 2) return D.rope; if (cx >= 9 && cx < 15 && cy >= 5 && cy < 8) return hb(i, j, 811) < .5 ? D.twine : D.rope; if (cx >= 11 && cx < 13 && cy >= 11 && cy < 13) return D.tahitiGold; return cx === 23 || cy === 17 ? D.loulou : D.oiledCedar; },
  kitchen(x, y, r) { const floor = (r.y1 + 1) * 48; if (y >= floor - 36) { const bx = ((x % 12) + 12) % 12; if (y < floor - 33) return D.rope; return bx < 1 ? D.valhalla : bx === 1 ? D.oiledCedar : D.loulou; } const tx = ((x % 18) + 18) % 18, ty = ((y % 18) + 18) % 18; if (tx === 0 || ty === 0) return D.loulou; return bayer(x, y) < .25 ? D.rope : D.oiledCedar; },
  wallGreen(x, y, r) { const floor = (r.y1 + 1) * 48; if (y >= floor - 30) return y < floor - 27 ? D.rope : (((x % 12) + 12) % 12 < 1 ? D.loulou : D.oiledCedar); const sx = ((x % 18) + 18) % 18, my = ((y % 24) + 24) % 24; if (sx < 2) return D.eltGreen; if (sx >= 8 && sx < 10 && my >= 10 && my < 12) return D.christi; if (((sx === 7 || sx === 10) && my === 11) || ((my === 9 || my === 12) && (sx === 8 || sx === 9))) return D.eltGreen; return D.dell; },
  wallRose(x, y, r) { const floor = (r.y1 + 1) * 48; if (y >= floor - 30) return y < floor - 27 ? D.rope : (((x % 12) + 12) % 12 < 1 ? D.valhalla : D.oiledCedar); const sx = ((x % 18) + 18) % 18, my = ((y + (Math.floor(x / 18) & 1) * 12) % 24 + 24) % 24; if (sx === 0) return D.oiledCedar; if (sx >= 8 && sx < 10 && my >= 8 && my < 10) return D.mandy; if (sx >= 8 && sx < 10 && my === 10) return D.smokeyAsh; if (sx === 10 && my === 11) return D.dell; return D.loulou; },
  rafters(x, y) { const px = ((x % 288) + 288) % 288; if (px < 12) return px < 2 ? D.rope : px > 10 ? D.loulou : D.oiledCedar; const by = ((y % 12) + 12) % 12; if (by === 0) return D.valhalla; if (by === 1) return D.oiledCedar; return D.loulou; },
  brick(x, y) { const row = Math.floor(y / 9), bx = (((x + (row & 1) * 9) % 18) + 18) % 18, by = ((y % 9) + 9) % 9; if (bx >= 16 || by >= 7) return D.valhalla; if (by === 0) return D.rope; return hb(Math.floor((x + (row & 1) * 9) / 18), row, 820) < .2 ? D.loulou : D.oiledCedar; },
  earth(x, y, r) { const post = (((x - 18) % 336) + 336) % 336; if (post < 12) return post < 2 ? D.twine : post > 9 ? D.oiledCedar : D.rope; if (y < r.y0 * 48 + 9) return y < r.y0 * 48 + 2 ? D.twine : y > r.y0 * 48 + 7 ? D.oiledCedar : D.rope; const cx = Math.floor(x / 12), cy = Math.floor(y / 9); if (hb(cx, cy, 830) < .3 && ((x % 12) + 12) % 12 < 6 && ((y % 9) + 9) % 9 < 2) return D.oiledCedar; if (hb(cx, cy, 831) < .08 && ((x % 12) + 12) % 12 < 2 && ((y % 9) + 9) % 9 === 4) return D.black; return D.valhalla; },
  cave(x, y) { const cx = Math.floor(x / 12), cy = Math.floor(y / 9); if (hb(cx, cy, 840) < .3 && ((x % 12) + 12) % 12 < 6 && ((y % 9) + 9) % 9 < 2) return D.deepKoamaru; if (hb(cx, cy, 841) < .05 && ((x % 12) + 12) % 12 < 2 && ((y % 9) + 9) % 9 < 3) return D.venice; return D.valhalla; },
};

// ===================================================================== light
// L(x,y) = room ambient (interpolated between tile centres) + Σ sources (1 − d/r)^1.5 · str.
// Rendering a pixel at L: k = (0.62 − L)/0.16 ramp steps down (Bayer between n and n+1);
// above 0.86 the pixel dithers one step up. Warm sources also scatter sparse glow pixels
// (goldenFizz inside a quarter radius, tahitiGold out to 0.6 r) on the backdrop only.
function lightAt(fx, fy, amb, lights) {
  const tx = fx / 48 - .5, ty = fy / 48 - .5, x0 = Math.floor(tx), y0 = Math.floor(ty), ax = tx - x0, ay = ty - y0;
  const A = (x, y) => (amb[y] && amb[y][x] != null) ? amb[y][x] : 0;
  let L = A(x0, y0) * (1 - ax) * (1 - ay) + A(x0 + 1, y0) * ax * (1 - ay) + A(x0, y0 + 1) * (1 - ax) * ay + A(x0 + 1, y0 + 1) * ax * ay;
  for (const s of lights) { const d = Math.hypot(fx / 48 - s.x, fy / 48 - s.y); if (d < s.r) L += s.str * Math.pow(1 - d / s.r, 1.5); }
  return L;
}
function lit(c, L, x, y) {
  if (L > 0.86) return bayer(x, y) < Math.min(.5, (L - .86) / .2) ? hiOf(c) : c;
  const k = Math.max(0, Math.min(4, (0.62 - L) / 0.16)); let n = Math.floor(k); if (bayer(x, y) < k - n) n++;
  for (let i = 0; i < n; i++) c = loOf(c); return c;
}

// ===================================================================== props (classic, base on y = 0; hang: anchor at the ceiling, +y down)
const P = {};
const pot = (g, x, yb) => { g.rect(x - 2, yb - 4, 5, 4).fill(D.tahitiGold); g.rect(x - 3, yb - 5, 7, 1).fill(D.rope); g.rect(x - 1, yb - 1, 3, 1).fill(D.rope); };
P.pottingBench = g => { g.rect(-17, -15, 34, 2).fill(D.rope); g.rect(-17, -15, 34, 1).fill(D.twine); g.rect(-15, -13, 2, 13).fill(D.oiledCedar); g.rect(13, -13, 2, 13).fill(D.oiledCedar); g.rect(-15, -5, 30, 1).fill(D.rope); pot(g, -10, -15); pot(g, -3, -15); g.rect(-3, -23, 1, 3).fill(D.dell); g.rect(-4, -22, 1, 1).fill(D.eltGreen); g.rect(-2, -21, 1, 1).fill(D.eltGreen); g.rect(4, -16, 6, 1).fill(D.heather); g.rect(9, -17, 3, 2).fill(D.oiledCedar); g.rect(-12, -8, 10, 3).fill(D.oiledCedar); for (const x of [-11, -8, -5]) g.rect(x, -9, 1, 1).fill(D.christi); g.rect(3, -4, 8, 4).fill(D.twine); g.rect(4, -5, 6, 1).fill(D.twine); g.rect(6, -5, 2, 1).fill(D.rope); };
P.pots = g => { pot(g, -4, 0); pot(g, 3, 0); g.rect(-2, -9, 5, 4).fill(D.tahitiGold); g.rect(-3, -5, 7, 1).fill(D.rope); };
P.rake = g => { for (let i = 0; i < 26; i++) g.rect(3 - Math.floor(i / 5), -1 - i, 1, 1).fill(D.rope); g.rect(-6, -30, 8, 1).fill(D.dimGray); for (const x of [-6, -4, -2, 0]) g.rect(x, -29, 1, 2).fill(D.dimGray); };
P.shedDoor = g => { g.rect(-11, -44 + 16, 22, 28).fill(D.oiledCedar); g.rect(-11, -28, 3, 28).fill(D.valhalla); g.rect(-11, -28, 22, 1).fill(D.rope); g.rect(6, -14, 2, 2).fill(D.twine); for (const x of [-4, 2]) g.rect(x, -27, 1, 27).fill(D.loulou); };
P.shedWindow = g => { g.rect(-16, -23, 32, 24).fill(D.oiledCedar); for (const [y, h, c] of [[-22, 6, D.smokeyAsh], [-16, 6, D.brown], [-10, 5, D.tahitiGold], [-5, 5, D.twine]]) g.rect(-15, y, 30, h).fill(c); g.rect(-1, -22, 1, 22).fill(D.oiledCedar); g.rect(-15, -12, 30, 1).fill(D.oiledCedar); g.rect(-17, 0, 34, 2).fill(D.rope); g.rect(-17, 0, 34, 1).fill(D.twine); g.rect(-10, -6, 8, 6).fill(D.tahitiGold); g.rect(-11, -7, 10, 1).fill(D.rope); g.rect(-7, -10, 1, 4).fill(D.dell); g.rect(-8, -9, 1, 1).fill(D.eltGreen); };
P.smallWindow = g => { g.rect(-9, -15, 18, 16).fill(D.oiledCedar); for (const [y, h, c] of [[-14, 5, D.smokeyAsh], [-9, 5, D.brown], [-4, 4, D.tahitiGold]]) g.rect(-8, y, 16, h).fill(c); g.rect(-1, -14, 1, 14).fill(D.oiledCedar); g.rect(-10, 0, 20, 1).fill(D.rope); };
P.skylight = g => { g.rect(-14, -6, 28, 7).fill(D.oiledCedar); g.rect(-12, -5, 24, 5).fill(D.deepKoamaru); g.rect(-12, -5, 24, 2).fill(D.smokeyAsh); g.rect(-1, -5, 1, 5).fill(D.oiledCedar); g.rect(5, -4, 1, 1).fill(D.lightSteel); };
P.drawerCabinet = g => { g.rect(-14, -40, 28, 40).fill(D.oiledCedar); g.rect(-14, -40, 28, 1).fill(D.rope); g.rect(-15, -42, 30, 2).fill(D.rope); for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { g.rect(-12 + c * 6, -38 + r * 5, 5, 4).fill(D.rope); g.rect(-10 + c * 6, -36 + r * 5, 1, 1).fill(D.goldenFizz); } g.rect(-14, -3, 28, 3).fill(D.loulou); };
P.stove = g => { g.rect(-15, -20, 30, 20).fill(D.valhalla); g.rect(-16, -22, 32, 2).fill(D.dimGray); g.rect(-16, -22, 32, 1).fill(D.heather); g.rect(-12, -16, 11, 11).fill(D.opal); g.rect(-10, -11, 7, 1).fill(D.heather); g.rect(2, -16, 10, 9).fill(D.loulou); g.rect(3, -14, 8, 6).fill(D.tahitiGold); g.rect(4, -12, 6, 3).fill(D.goldenFizz); for (const x of [5, 8]) g.rect(x, -14, 1, 6).fill(D.valhalla); g.rect(2, -5, 10, 2).fill(D.dimGray); g.rect(9, -64, 4, 42).fill(D.opal); g.rect(9, -64, 1, 42).fill(D.dimGray); g.rect(-10, -28, 8, 6).fill(D.heather); g.rect(-9, -29, 6, 1).fill(D.heather); g.rect(-2, -27, 3, 1).fill(D.heather); g.rect(-8, -31, 4, 1).fill(D.topaz); g.rect(-7, -30, 2, 1).fill(D.topaz); g.rect(0, -24, 7, 2).fill(D.dimGray); };
P.kitchenTable = g => { g.rect(-16, -12, 32, 2).fill(D.rope); g.rect(-16, -12, 32, 1).fill(D.twine); for (const x of [-15, 13]) g.rect(x, -10, 2, 10).fill(D.oiledCedar); g.rect(-6, -16, 6, 4).fill(D.lightSteel); g.rect(-6, -16, 6, 1).fill(D.white); g.rect(4, -14, 6, 2).fill(D.tahitiGold); };
P.jars = g => { for (const [x, h, c] of [[-24, 8, D.clairvoyant], [-14, 10, D.tahitiGold], [-4, 7, D.eltGreen], [6, 9, D.mandy], [16, 8, D.goldenFizz]]) { g.rect(x, -h, 7, h).fill(c); g.rect(x, -h, 7, 2).fill(D.lightSteel); g.rect(x + 1, -h + 3, 1, h - 4).fill({color: D.white, alpha: 0.4}); } };
P.candle = g => { g.rect(-3, -1, 6, 1).fill(D.rainforest); g.rect(-1, -7, 2, 6).fill(D.white); g.rect(-1, -7, 2, 1).fill(D.lightSteel); g.rect(0, -8, 1, 1).fill(D.valhalla); g.rect(0, -11, 1, 3).fill(D.goldenFizz); g.rect(0, -9, 1, 1).fill(D.tahitiGold); };
P.lampHang = g => { g.rect(0, 0, 1, 10).fill(D.topaz); g.rect(-3, 10, 7, 2).fill(D.rainforest); g.rect(-2, 12, 5, 5).fill(D.goldenFizz); g.rect(-1, 13, 3, 3).fill(D.white); g.rect(-3, 17, 7, 1).fill(D.rainforest); };
P.herbs = g => { g.rect(0, 0, 1, 5).fill(D.twine); g.rect(-2, 5, 5, 7).fill(D.dell); g.rect(-1, 5, 3, 1).fill(D.rope); g.rect(-3, 7, 1, 3).fill(D.eltGreen); g.rect(3, 8, 1, 3).fill(D.eltGreen); g.rect(-1, 12, 1, 2).fill(D.dell); g.rect(1, 12, 1, 3).fill(D.dell); };
P.lavender = g => { g.rect(0, 0, 1, 5).fill(D.twine); g.rect(-1, 5, 3, 6).fill(D.dell); g.rect(-1, 5, 3, 1).fill(D.rope); g.rect(-2, 11, 1, 4).fill(D.smokeyAsh); g.rect(0, 11, 1, 5).fill(D.smokeyAsh); g.rect(2, 11, 1, 4).fill(D.smokeyAsh); g.rect(0, 15, 1, 1).fill(D.mandy); };
P.onions = g => { g.rect(0, 0, 1, 16).fill(D.twine); for (const [x, y] of [[-3, 4], [1, 8], [-3, 12]]) { g.rect(x, y, 4, 3).fill(D.twine); g.rect(x + 1, y - 1, 2, 1).fill(D.rope); g.rect(x + 1, y + 3, 2, 1).fill(D.pancho); } };
P.dressForm = g => { g.rect(-1, -6, 2, 6).fill(D.oiledCedar); g.rect(-4, -1, 8, 1).fill(D.oiledCedar); g.rect(-5, -20, 10, 7).fill(D.smokeyAsh); g.rect(-4, -13, 8, 7).fill(D.smokeyAsh); g.rect(-3, -22, 6, 2).fill(D.smokeyAsh); g.rect(-1, -24, 2, 2).fill(D.rainforest); g.rect(-5, -16, 10, 1).fill(D.twine); g.rect(2, -19, 1, 1).fill(D.goldenFizz); };
P.desk = g => { g.rect(-14, -11, 28, 2).fill(D.rope); g.rect(-14, -11, 28, 1).fill(D.twine); g.rect(-13, -9, 8, 9).fill(D.oiledCedar); g.rect(-12, -7, 6, 1).fill(D.rope); g.rect(-12, -4, 6, 1).fill(D.rope); g.rect(11, -9, 2, 9).fill(D.oiledCedar); g.rect(2, -14, 6, 3).fill(D.pancho); g.rect(5, -14, 1, 3).fill(D.twine); g.rect(-6, -12, 1, 1).fill(D.rainforest); g.rect(-6, -18, 1, 6).fill(D.rainforest); g.rect(-9, -21, 6, 3).fill(D.eltGreen); g.rect(-8, -18, 4, 1).fill(D.goldenFizz); };
P.trunk = g => { g.rect(-10, -11, 20, 11).fill(D.rope); g.rect(-10, -11, 20, 3).fill(D.oiledCedar); g.rect(-10, -11, 20, 1).fill(D.twine); g.rect(-7, -11, 2, 11).fill(D.oiledCedar); g.rect(5, -11, 2, 11).fill(D.oiledCedar); g.rect(-1, -8, 3, 3).fill(D.goldenFizz); g.rect(0, -7, 1, 1).fill(D.valhalla); g.rect(-10, -1, 20, 1).fill(D.oiledCedar); };
P.sheetedTrunk = g => { g.rect(-6, -20, 10, 6).fill(D.heather); g.rect(-5, -20, 8, 1).fill(D.lightSteel); g.rect(-12, -14, 24, 12).fill(D.heather); g.rect(-11, -15, 22, 1).fill(D.lightSteel); g.rect(-13, -2, 26, 2).fill(D.heather); g.rect(-6, -13, 1, 11).fill(D.topaz); g.rect(3, -13, 1, 11).fill(D.topaz); g.rect(-10, -14, 8, 1).fill(D.lightSteel); };
P.rockingHorse = g => { g.rect(-10, -2, 20, 1).fill(D.rope); g.rect(-11, -3, 2, 1).fill(D.rope); g.rect(9, -3, 2, 1).fill(D.rope); for (const x of [-6, -3, 2, 4]) g.rect(x, -7, 1, 5).fill(D.pancho); g.rect(-6, -11, 11, 4).fill(D.pancho); g.rect(4, -15, 3, 5).fill(D.pancho); g.rect(5, -17, 5, 3).fill(D.pancho); g.rect(3, -16, 1, 6).fill(D.oiledCedar); g.rect(-8, -11, 2, 4).fill(D.oiledCedar); g.rect(-3, -12, 5, 2).fill(D.clairvoyant); g.rect(8, -16, 1, 1).fill(D.valhalla); g.rect(-4, -10, 1, 1).fill(D.twine); g.rect(0, -9, 1, 1).fill(D.twine); };
P.bed = g => { g.rect(-17, -6, 34, 4).fill(D.rope); g.rect(-17, -2, 2, 2).fill(D.oiledCedar); g.rect(15, -2, 2, 2).fill(D.oiledCedar); g.rect(-17, -16, 3, 12).fill(D.oiledCedar); g.rect(-17, -16, 3, 1).fill(D.rope); g.rect(14, -11, 3, 7).fill(D.oiledCedar); g.rect(-14, -9, 28, 3).fill(D.lightSteel); g.rect(-8, -10, 22, 4).fill(D.clairvoyant); for (const [x, y, c] of [[-6, -10, D.mandy], [-1, -8, D.mandy], [4, -10, D.twine], [9, -8, D.mandy]]) g.rect(x, y, 3, 2).fill(c); g.rect(-8, -10, 22, 1).fill(D.brown); g.rect(-14, -11, 6, 3).fill(D.white); };
P.appleCrate = g => { g.rect(-8, -9, 16, 9).fill(D.rope); g.rect(-8, -6, 16, 1).fill(D.oiledCedar); g.rect(-8, -3, 16, 1).fill(D.oiledCedar); g.rect(-8, -9, 1, 9).fill(D.oiledCedar); g.rect(7, -9, 1, 9).fill(D.oiledCedar); for (const x of [-6, -3, 0, 3]) { g.rect(x, -11, 3, 2).fill(D.clairvoyant); g.rect(x, -11, 1, 1).fill(D.brown); } g.rect(-2, -12, 1, 1).fill(D.christi); };
P.boiler = g => { g.rect(-2, -50, 4, 18).fill(D.dimGray); g.rect(-2, -50, 1, 18).fill(D.heather); g.rect(-9, -33, 18, 3).fill(D.rope); g.rect(-11, -30, 22, 26).fill(D.rope); g.rect(-11, -30, 3, 26).fill(D.tahitiGold); for (const y of [-27, -16]) for (let x = -8; x <= 8; x += 4) g.rect(x, y, 1, 1).fill(D.twine); g.rect(-10, -4, 3, 4).fill(D.valhalla); g.rect(7, -4, 3, 4).fill(D.valhalla); g.rect(-5, -11, 10, 6).fill(D.valhalla); g.rect(-4, -9, 8, 3).fill(D.tahitiGold); g.rect(-3, -8, 6, 1).fill(D.goldenFizz); discL(g, 5, -22, 2, D.pancho); g.rect(5, -23, 1, 2).fill(D.valhalla); };
P.pipes = g => { g.rect(-32, 3, 64, 3).fill(D.dimGray); g.rect(-32, 3, 64, 1).fill(D.heather); for (const x of [-28, 0, 28]) g.rect(x, 0, 1, 3).fill(D.topaz); g.rect(14, 6, 3, 10).fill(D.dimGray); g.rect(14, 6, 1, 10).fill(D.heather); g.rect(12, 10, 7, 2).fill(D.rainforest); g.rect(15, 9, 1, 1).fill(D.goldenFizz); };
P.roots = g => { for (const [x, len] of [[-6, 10], [-2, 16], [3, 8], [6, 13]]) { g.rect(x, 0, 1, len).fill(D.rope); g.rect(x, len, 1, 1).fill(D.twine); g.rect(x + (x < 0 ? -1 : 1), Math.floor(len / 2), 1, 3).fill(D.rope); } };

// ===================================================================== creatures (new)
// Spider: hangs on a thread from the ceiling; body around (0,0), thread drawn by the entity. 9 wide × 6 tall.
C.spider = function (g, f) { g.rect(-2, 0, 4, 3).fill(D.valhalla); g.rect(-1, 3, 2, 2).fill(D.loulou); g.rect(-1, 1, 2, 1).fill(D.twine); const legs = f ? [[-4, -1], [-4, 2], [-3, 4], [3, -1], [3, 2], [2, 4]] : [[-4, 0], [-4, 3], [-3, 5], [3, 0], [3, 3], [2, 5]]; for (const [x, y] of legs) g.rect(x, y, 2, 1).fill(D.valhalla); };
C.spiderLarge = function (g) { g.rect(0, -36, 1, 14).fill(D.heather); discL(g, 0, -16, 7, D.valhalla); discL(g, 0, -5, 4, D.loulou); for (const [x, y] of [[-2, -18], [1, -14], [-1, -11]]) g.rect(x, y, 2, 2).fill(D.twine); for (const s of [-1, 1]) for (const [a, b, c2] of [[6, -19, -24], [7, -14, -16], [7, -9, -6], [5, -4, 2]]) { g.rect(s > 0 ? a : -a - 4, b, 5, 1).fill(D.valhalla); g.rect(s > 0 ? a + 4 : -a - 5, b < c2 ? b : c2, 1, Math.abs(c2 - b) + 1).fill(D.valhalla); } g.rect(-2, -3, 1, 1).fill(D.white); g.rect(1, -3, 1, 1).fill(D.white); };
// Mole: 12 wide × 7, nose right; frame swaps which paw is out front.
C.mole = function (g, f) { g.rect(-6, -6, 10, 6).fill(D.valhalla); g.rect(-5, -7, 8, 1).fill(D.deepKoamaru); g.rect(-4, -6, 6, 1).fill(D.deepKoamaru); g.rect(4, -4, 2, 2).fill(D.valhalla); g.rect(6, -4, 1, 1).fill(D.mandy); if (f) { g.rect(4, -2, 3, 1).fill(D.mandy); g.rect(3, -1, 2, 1).fill(D.mandy); } else g.rect(3, -1, 3, 1).fill(D.mandy); g.rect(-5, -1, 2, 1).fill(D.mandy); g.rect(-7, -3, 1, 1).fill(D.mandy); };
C.moleLarge = function (g) { for (let dy = -10; dy <= 10; dy++) { const h = Math.round(18 * Math.sqrt(1 - (dy * dy) / 100)); g.rect(-h, -12 + dy, h * 2, 1).fill(D.valhalla); } g.rect(-12, -21, 20, 2).fill(D.deepKoamaru); g.rect(-8, -19, 12, 1).fill(D.deepKoamaru); g.rect(16, -14, 6, 5).fill(D.valhalla); g.rect(22, -13, 3, 3).fill(D.mandy); g.rect(23, -13, 1, 1).fill(D.white); for (const y of [-15, -12, -9]) g.rect(24, y, 6, 1).fill(D.lightSteel); g.rect(10, -4, 9, 4).fill(D.mandy); for (const x of [11, 14, 17]) g.rect(x, 0, 2, 2).fill(D.mandy); g.rect(-14, -2, 6, 2).fill(D.mandy); g.rect(-20, -9, 2, 2).fill(D.mandy); g.rect(14, -15, 1, 1).fill(D.dimGray); };
// Worm: the bookworm's shape, earth-pink, no spectacles, a darker band.
C.worm = function (g, f) { const b = D.mandy; if (f === 1) { g.rect(-4, -1, 2, 1).fill(b); g.rect(-2, -3, 3, 2).fill(b); g.rect(1, -1, 2, 1).fill(b); g.rect(3, -2, 2, 2).fill(b); g.rect(-1, -3, 1, 2).fill(D.brown); } else { g.rect(-5, -1, 10, 1).fill(b); g.rect(3, -2, 2, 2).fill(b); g.rect(0, -1, 2, 1).fill(D.brown); } };
C.wormLarge = function (g) { for (let i = 0; i < 14; i++) { const x = -26 + i * 4, y = -6 - Math.round(Math.sin(i * 0.55) * 6); discL(g, x, y, 3, i === 9 || i === 10 ? D.brown : D.mandy); g.rect(x - 1, y + 2, 2, 1).fill(D.smokeyAsh); } g.rect(28, -11, 1, 1).fill(D.valhalla); };
const CRITTER_TEXT = {
  spider: {name: 'Spider', text: "Don't mind me. I'm just hanging around. Literally, it's the whole job."},
  mole: {name: 'Mole', text: "Is someone there? You smell like you're wearing boots indoors."},
  worm: {name: 'Earthworm', text: 'Down here we call it a tunnel. Up there they call it a lawn. Same thing, really.'},
};

// ===================================================================== landmarks (body in-world, sketch at page size)
P.grandfatherClock = g => { g.rect(-7, -8, 14, 8).fill(D.oiledCedar); g.rect(-7, -8, 14, 1).fill(D.rope); g.rect(-5, -30, 10, 22).fill(D.oiledCedar); g.rect(-5, -30, 1, 22).fill(D.rope); g.rect(-2, -26, 4, 14).fill(D.valhalla); g.rect(0, -26, 1, 10).fill(D.rainforest); g.rect(-1, -17, 3, 3).fill(D.goldenFizz); g.rect(-7, -44, 14, 14).fill(D.oiledCedar); g.rect(-7, -44, 14, 1).fill(D.rope); g.rect(-5, -46, 10, 2).fill(D.oiledCedar); g.rect(-1, -48, 2, 2).fill(D.goldenFizz); discL(g, 0, -37, 5, D.pancho); for (const [x, y] of [[0, -41], [3, -38], [0, -34], [-3, -37], [-1, -39], [1, -36]]) g.rect(x, y, 1, 1).fill(D.valhalla); g.rect(0, -39, 1, 2).fill(D.valhalla); g.rect(0, -37, 2, 1).fill(D.valhalla); };
P.clockSketch = g => { g.rect(-14, -30, 28, 60).fill(D.oiledCedar); g.rect(-14, -30, 28, 2).fill(D.rope); discL(g, 0, -10, 12, D.pancho); const sp = [[-9, -19], [9, -19], [9, -1], [-6, -1], [-6, -15], [6, -15], [6, -5], [-3, -5], [-3, -11], [2, -11]]; for (let i = 0; i + 1 < sp.length; i++) { const [ax, ay] = sp[i], [bx, by] = sp[i + 1]; g.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1).fill(D.valhalla); } g.rect(-5, 6, 10, 20).fill(D.valhalla); g.rect(0, 6, 1, 13).fill(D.rainforest); discL(g, 0, 21, 3, D.goldenFizz); };
P.seedCatalogue = g => { g.rect(-1, -14, 3, 14).fill(D.oiledCedar); g.rect(-5, -2, 11, 2).fill(D.oiledCedar); g.rect(-8, -18, 16, 4).fill(D.rope); g.rect(-8, -18, 16, 1).fill(D.twine); g.rect(-7, -21, 6, 3).fill(D.pancho); g.rect(1, -21, 6, 3).fill(D.pancho); g.rect(-1, -21, 2, 3).fill(D.clairvoyant); g.rect(-6, -20, 4, 1).fill(D.twine); g.rect(2, -20, 4, 1).fill(D.twine); g.rect(3, -19, 1, 1).fill(D.dell); };
P.catalogueSketch = g => { g.rect(-30, -22, 29, 40).fill(D.pancho); g.rect(1, -22, 29, 40).fill(D.pancho); g.rect(-1, -22, 2, 40).fill(D.clairvoyant); g.rect(-30, 18, 60, 2).fill(D.rope); for (const [x, y] of [[-24, -14], [-14, -14], [-24, -2], [-14, -2]]) { discL(g, x, y, 3, D.rope); g.rect(x - 4, y + 5, 9, 1).fill(D.twine); g.rect(x, y - 6, 1, 3).fill(D.dell); } g.rect(6, -16, 20, 24).fill(D.twine); g.rect(6, -16, 20, 2).fill(D.rope); const sp = [[10, -11], [22, -11], [22, 4], [13, 4], [13, -6], [19, -6], [19, 0], [16, 0]]; for (let i = 0; i + 1 < sp.length; i++) { const [ax, ay] = sp[i], [bx, by] = sp[i + 1]; g.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1).fill(D.valhalla); } };
function roundWin(g, cx, cy, r) { discL(g, cx, cy, r + 2, D.oiledCedar); for (let dy = -r; dy <= r; dy++) { const h = Math.round(Math.sqrt(r * r - dy * dy)), t = (dy + r) / (2 * r); g.rect(cx - h, cy + dy, h * 2 + 1, 1).fill(t < .3 ? D.smokeyAsh : t < .55 ? D.brown : t < .75 ? D.tahitiGold : D.twine); }
  for (const [x0, w, top] of [[-0.8, .3, .62], [-.45, .25, .7], [-.15, .35, .58], [.25, .3, .66], [.5, .3, .74]]) for (let dy = Math.round(top * 2 * r - r); dy <= r; dy++) { const h = Math.round(Math.sqrt(r * r - dy * dy)); const a = Math.max(cx - h, cx + Math.round(x0 * r)), b = Math.min(cx + h, cx + Math.round((x0 + w) * r)); if (b > a) g.rect(a, cy + dy, b - a, 1).fill(D.valhalla); }
  g.rect(cx, cy - r, 1, 2 * r).fill(D.oiledCedar); g.rect(cx - r, cy, 2 * r, 1).fill(D.oiledCedar); }
P.wrongWindow = g => { roundWin(g, 0, -40, 22); g.rect(-26, -17, 52, 2).fill(D.rope); g.rect(-26, -17, 52, 1).fill(D.twine); g.rect(8, -23, 8, 6).fill(D.tahitiGold); g.rect(7, -24, 10, 1).fill(D.rope); g.rect(11, -27, 1, 3).fill(D.dell); g.rect(10, -26, 1, 1).fill(D.eltGreen); };
P.windowSketch = g => { roundWin(g, 0, -4, 26); g.rect(-30, 24, 60, 3).fill(D.rope); g.rect(-30, 24, 60, 1).fill(D.twine); g.rect(10, 18, 8, 6).fill(D.tahitiGold); g.rect(9, 17, 10, 1).fill(D.rope); g.rect(13, 14, 1, 3).fill(D.dell); };
P.dumbwaiter = g => { g.rect(-9, -26, 18, 22).fill(D.oiledCedar); g.rect(-9, -26, 18, 1).fill(D.rope); g.rect(-7, -24, 14, 18).fill(D.valhalla); g.rect(0, -24, 1, 9).fill(D.twine); g.rect(-6, -15, 12, 9).fill(D.rope); g.rect(-6, -15, 12, 1).fill(D.twine); g.rect(-2, -18, 4, 3).fill(D.lightSteel); g.rect(2, -17, 1, 1).fill(D.lightSteel); g.rect(-3, -28, 6, 2).fill(D.dimGray); g.rect(-10, -6, 20, 2).fill(D.rope); };
P.dumbwaiterSketch = g => { g.rect(-24, -30, 48, 52).fill(D.oiledCedar); g.rect(-20, -26, 40, 44).fill(D.valhalla); g.rect(0, -30, 1, 22).fill(D.twine); g.rect(-16, -8, 32, 22).fill(D.rope); g.rect(-16, -8, 32, 2).fill(D.twine); g.rect(-6, -16, 10, 8).fill(D.lightSteel); g.rect(4, -14, 3, 4).fill(D.lightSteel); g.rect(-5, -16, 8, 2).fill(D.rope); g.rect(-26, 18, 52, 4).fill(D.rope); };
function rootSpiral(g, s, base) { const sp = [[-14, -24], [14, -24], [14, -4], [-10, -4], [-10, -20], [10, -20], [10, -8], [-6, -8], [-6, -16], [6, -16], [6, -12], [-2, -12]].map(([x, y]) => [Math.round(x * s), Math.round((y + 14) * s) + base]); for (let i = 0; i + 1 < sp.length; i++) { const [ax, ay] = sp[i], [bx, by] = sp[i + 1]; g.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1).fill(D.rope); } for (const i of [0, 2, 5, 9]) { const [x, y] = sp[i]; g.rect(x - 1, y + 1, 4, 3).fill(D.pancho); g.rect(x, y + 2, 2, 1).fill(D.valhalla); } }
P.rootMap = g => { g.rect(-3, -4, 6, 4).fill(D.rope); rootSpiral(g, 1, -14); };
P.rootMapSketch = g => rootSpiral(g, 2, 0);
