'use strict';
// HD recipes. Fine grid: 1 fine px = 1/3 logical. Coordinates are fine px around the
// same anchor as the classic sprite (feet / base on y = 0), so logical x maps to 3x.
const H = {};
F.prototype.shade = function (x, y, w, h, from, to, t) { const f = [].concat(from), fn = typeof t === 'function'; for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (f.includes(this.get(k, j)) && bayer(k, j) < (fn ? t(k, j) : t)) this.set(k, j, to); return this; };
F.prototype.recolor = function (x, y, w, h, from, to) { return this.shade(x, y, w, h, from, to, 1); };
// Classic opaque rects ×3: the starting block every derived recipe refines.
function up(g) { const ops = g.ops.filter(o => o.a === 1); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const o of ops) { x0 = Math.min(x0, o.x); y0 = Math.min(y0, o.y); x1 = Math.max(x1, o.x + o.w); y1 = Math.max(y1, o.y + o.h); } const S = new F(x0 * 3 - 3, y0 * 3 - 3, (x1 - x0) * 3 + 6, (y1 - y0) * 3 + 6); for (const o of ops) S.rect(o.x * 3, o.y * 3, o.w * 3, o.h * 3, o.c); return S; }

// ---------------------------------------------------------------- THE FIGURE
// p: {air, swim, climb, climbPhase, step, bob, front, back} — step/bob/arm lengths in FINE px.
H.figure = function (p) {
  const S = new F(-24, -54, 48, 54), B = p.bob, cl = D.lightSteel, hz = D.heather;
  if (p.air || p.swim) { S.rect(-6, -6, 6, 6, hz); S.rect(0, -6, 6, 6, hz); }
  else { S.rect(-9 + p.step, -6, 6, 6, hz); S.rect(3 - p.step, -6, 6, 6, hz); }
  const cy = -30 + B, hy = -48 + B;
  S.rect(-15, cy, 30, 24, cl); S.rect(-12, hy, 24, 18, cl);
  if (p.swim) { S.rect(6, -21, p.front, 3, D.dimGray); S.rect(-6 - p.back, -21, p.back, 3, D.dimGray); }
  S.round(); S.clr(-11, hy, -12, hy + 1, 10, hy, 11, hy + 1);
  // cloak: lit shoulder line, form shadow on the right (light upper-left), heavier hem
  S.rect(-14, cy, 28, 2, D.white).dither(-14, cy + 2, 28, 1, null, D.white, .5);
  S.recolor(12, cy + 2, 2, 20, cl, hz); S.shade(8, cy + 3, 4, 18, cl, hz, .5);
  S.shade(-14, cy + 17, 28, 4, [cl, D.white], hz, .5).recolor(-14, cy + 21, 28, 3, [cl, D.white], hz);
  // hood
  S.recolor(-10, hy, 20, 3, cl, D.white); S.recolor(9, hy + 2, 2, 15, cl, hz);
  S.rect(-9, hy + 3, 18, 12, D.valhalla); S.set(-9, hy + 3, D.white).set(-8, hy + 3, D.white).set(-9, hy + 4, cl).set(8, hy + 3, D.white).set(7, hy + 3, D.white).set(8, hy + 4, cl);
  S.dither(-8, hy + 13, 16, 2, null, D.deepKoamaru, .5);
  // the one full outline in the game: 1 fine valhalla, every edge
  S.outline(D.valhalla);
  S.recolor(-13, -6, 22, 1, hz, D.topaz); // contact shadow under the hem
  const ey = -39 + B + (p.air ? -6 : 0); S.rect(3, ey, 2, 2, D.twine).set(3, ey, D.pancho);
  const strap = D.dimGray;
  if (p.climb) { const h = p.climbPhase ? 3 : 0; S.rect(-11, -42 - h, 2, 12, strap).set(-11, -42 - h, D.topaz); S.rect(9, -42 + h, 2, 12, strap).set(9, -42 + h, D.topaz); }
  else if (p.swim) S.recolor(-14, -18, 28, 1, [cl, D.white], hz);
  else if (p.air) { S.line(1, -27, 10, -36, hz); S.line(0, -29, 9, -38, strap, 2); }
  else { const dx = -p.step; for (let i = 0; i < 10; i++) S.recolor(-12 + dx + i, -18 + B + i, 1, 1, [cl, D.white], hz); S.line(-12 + dx, -20 + B, -3 + dx, -11 + B, strap, 2); }
  return S;
};
H.poseFromClassic = c => ({air: c.airborne, swim: c.swimming, climb: !!c.climbing, climbPhase: c.climbPhase || 0, step: 3 * c.stepOffset, bob: 3 * c.bodyBob, front: 3 * (3 + Math.round(c.swimPhase * 2)), back: 3 * (3 - Math.round(c.swimPhase * 2))});

// ---------------------------------------------------------------- CREATURES
// Critter rule: no full outline. Edges facing the light take the ramp's hi, edges facing away its lo ("selout").
H.snail = function (f) {
  const S = new F(-12, -24, 30, 24), hz = D.heather, sh = D.rope;
  S.rect(-12, -3, 27, 3, hz).rect(6, -9, 9, 6, hz);
  S.rect(9, -15 - 3 * f, 2, 6 + 3 * f, hz).rect(15, -15 + 3 * f, 2, 6 - 3 * f, hz);
  S.rect(-12, -18, 18, 15, sh).rect(-9, -21, 12, 3, sh);
  S.clr(-12, -18, -11, -18, -12, -17, -9, -21, 2, -21, 5, -18, 4, -18, 14, -9, 13, -9, 14, -1, -12, -3, -12, -2);
  S.seam(sh, hz, D.oiledCedar); S.edges();
  for (let th = 0; th < Math.PI * 3.1; th += 0.03) { const r = 1 + th * 0.7, x = Math.floor(-3.5 + r * Math.cos(th + 2.6)), y = Math.floor(-12 + r * Math.sin(th + 2.6) * 0.9); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (S.get(x + a, y + b) === sh) S.set(x + a, y + b, D.twine); }
  S.recolor(-9, -20, 3, 1, [sh, D.twine], D.pancho);
  const eye = (x, y) => S.rect(x, y + 1, 3, 2, D.valhalla).set(x + 1, y, D.valhalla);
  eye(9, -18 - 3 * f); eye(15, -18 + 3 * f);
  return S;
};
const HARE_RAMP = new Map(RAMP); HARE_RAMP.set(D.white, [D.white, D.lightSteel]);
H.hare = function (pose) {
  const S = up(cg(C.hare, pose));
  S.round();
  if (pose.bounding) { S.clr(14, -36, 14, -35, 14, -34, 14, -33, 14, -32, 14, -31, 14, -30, 14, -29, 14, -28, 14, -27, 14, -26, 14, -25); S.clr(-17, -18, -18, -17); S.rect(15, -21, 3, 3, D.white).rect(15, -21, 2, 2, D.valhalla); }
  else {
    for (let y = -42; y < -33; y++) S.clr(14, y); for (let y = -39 + 3 * pose.ear; y < -33; y++) S.clr(8, y);
    S.clr(-11, -24, -12, -23, -10, -24); S.rect(12, -30, 3, 3, D.white).rect(12, -30, 2, 2, D.valhalla);
  }
  S.edges([D.valhalla, D.brown], HARE_RAMP);
  S.recolor(-21, -1, 42, 1, D.heather, D.topaz);
  return S;
};
// Glow: a dithered radial falloff of viking pixels (no alpha), same radii as the classic stepped rects.
H.halo = function (cx, cy, rx, ry, peak) { const S = new F(Math.floor(cx - rx) - 1, Math.floor(cy - ry) - 1, Math.ceil(rx * 2) + 3, Math.ceil(ry * 2) + 3); S.dither(S.x0, S.y0, S.w, S.h, null, D.viking, (x, y) => { const e = Math.hypot((x + .5 - cx) / rx, (y + .5 - cy) / ry); return e >= 1 ? 0 : peak * Math.pow(1 - e, 1.3); }); return S; };
H.glowfish = function (fr) {
  const g = cg(C.glowfish, fr); const S = up(g);
  S.round(); S.edges([D.viking, D.valhalla, D.white]);
  S.shade(-6, -3, 15, 1, D.viking, D.lightSteel, .5);
  S.rect(6, -6, 3, 3, D.lightSteel).rect(6, -6, 2, 2, D.valhalla);
  const lure = fr.glow > 0.5 ? D.white : D.viking; S.rect(12, -15, 3, 3, -1).rect(12, -14, 3, 1, lure).rect(13, -15, 1, 3, lure);
  S.clr(9, -12, 11, -10); return {body: S, halo: H.halo(-1.5, -4.5, 22.5, 16.5, 0.22 + fr.glow * 0.3)};
};
H.glowfishLarge = function () {
  const S = up(cg(C.glowfishLarge)); S.round(); S.elbows(); S.edges([D.viking, D.valhalla, D.white]);
  S.shade(-30, -33, 60, 9, D.heather, D.lightSteel, (x) => (x & 1) ? .9 : 0); // fin rays
  S.shade(-21, -15, 42, 3, D.viking, D.lightSteel, .35);
  S.rect(12, -24, 6, 6, D.lightSteel).disc(15, -21, 3, D.valhalla).rect(16, -24, 2, 2, D.white);
  S.rect(24, -42, 6, 6, -1).disc(27, -39, 3, D.white).set(28, -37, D.viking).set(29, -38, D.viking);
  return {body: S, halo: H.halo(0, -18, 42, 21, 0.42)};
};
H.moth = function (f) {
  const S = up(cg(C.moth, f)); S.round();
  if (f === 0) { S.clr(-9, -9, -8, -9, 11, -9, 10, -9); S.shade(-9, -6, 6, 3, D.pancho, D.twine, .5); S.shade(6, -6, 6, 3, D.pancho, D.twine, .5); }
  else { S.clr(-4, -12, -4, -11, -4, -10, -4, -9, -4, -8, -4, -7, 8, -12, 8, -11, 8, -10, 8, -9, 8, -8, 8, -7); S.set(-6, -12, -1).set(7, -12, -1); }
  S.edges(); S.recolor(-3, -6, 6, 1, D.rope, D.oiledCedar); return S;
};
H.mothLarge = function () {
  const S = up(cg(C.mothLarge)); S.round(); S.clr(-20, -24, -21, -23, 19, -24, 20, -23, -21, -13, 20, -13, -18, -4, -18, -5, 17, -4, 17, -5);
  S.edges([D.valhalla]);
  S.shade(-21, -21, 9, 12, D.pancho, D.twine, x => .45 * (1 - (x + 21) / 9));
  S.shade(12, -21, 9, 12, D.pancho, D.twine, x => .45 * ((x - 12) / 9));
  for (const [cx, p] of [[-12, -14], [12, 14]]) { S.disc(cx, -15, 3.2, D.rope); S.disc(cx + (p < 0 ? -1 : 1), -16, 1.6, D.valhalla); S.set(cx + (p < 0 ? 1 : -2), -13, D.twine); }
  for (const y of [-18, -12]) S.recolor(-3, y, 6, 1, D.rope, D.oiledCedar);
  return S;
};
// Foliage rule: scallops — a lit 3-px arc over a shadow arc, at a 6-fine pitch.
function foliage(S, base, lit, dark) { const o = []; S.forInk((x, y, c) => { if (c !== base) return; const u = ((x >> 1) + (Math.floor(y / 6) & 1) * 3) % 6, v = ((y % 6) + 6) % 6; if (v === 0 && u < 3) o.push(x, y, lit); else if (v === 3 && u >= 3 && u < 5) o.push(x, y, dark); }); S._apply(o); }
H.plant = function (fn) { const S = up(cg(fn)); S.round(); S.elbows(); S.edges([D.oiledCedar, D.rope]); foliage(S, D.eltGreen, D.christi, D.dell); foliage(S, D.dell, D.eltGreen, D.opal); S.forInk((x, y, c) => { if (c === D.oiledCedar && !S.ink(x - 1, y)) S.set(x, y, D.rope); }); return S; };

// The sketchbook portrait, drawn at page size (≈ 50×35 logical), not a scaled sprite.
H.snailPortrait = function () {
  const S = new F(-80, -96, 160, 104), hz = D.heather, sh = D.rope;
  S.rect(-66, -14, 120, 14, hz).disc(-66, -7, 7, hz).disc(54, -7, 7, hz);
  S.rect(30, -40, 24, 30, hz).disc(42, -40, 12, hz);
  S.line(35, -48, 28, -74, hz, 4); S.line(48, -48, 56, -70, hz, 4); S.line(52, -28, 64, -22, hz, 3);
  S.edges(); S.shade(-70, -6, 130, 6, hz, D.topaz, .5); S.recolor(-72, -1, 135, 1, [hz, D.lightSteel], D.topaz);
  S.disc(-12, -46, 36, sh); S.ring(-12, -46, 36, 2, D.oiledCedar);
  for (let th = 0; th < Math.PI * 4.6; th += 0.01) { const r = 2 + th * 2.25, x = Math.floor(-12 + r * Math.cos(th + 2.4)), y = Math.floor(-46 + r * Math.sin(th + 2.4)); S.rect(x, y, 4, 4, null); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (S.get(x + a, y + b) === sh) S.set(x + a, y + b, D.twine); }
  S.dither(-48, -82, 72, 72, null, null, 0);
  S.forInk((x, y, c) => { const dx = x + 12, dy = y + 46, d = Math.hypot(dx, dy); if ((c === sh || c === D.twine) && d < 34) { const lit = (-dx - dy) / (d || 1); if (lit > .35 && d > 24 && bayer(x, y) < .5) S.set(x, y, c === sh ? D.twine : D.pancho); if (lit < -.4 && d > 22 && bayer(x, y) < .55) S.set(x, y, c === sh ? D.oiledCedar : sh); } });
  S.rect(-34, -72, 8, 3, D.pancho).rect(-37, -68, 4, 3, D.pancho);
  S.disc(28, -76, 5, D.valhalla).rect(27, -79, 2, 2, D.white); S.disc(57, -72, 5, D.valhalla).rect(56, -75, 2, 2, D.white);
  for (const [x, y] of [[-40, -13], [-12, -12], [14, -13]]) S.rect(x, y, 6, 1, D.white);
  return S;
};

// ---------------------------------------------------------------- TILES
// Written into one world-sized fine buffer; X, Y = tile origin in fine px.
const T3 = 48;
H.grass = function (S, X, Y, tx, ty) {
  S.rect(X, Y, T3, T3, D.eltGreen).rect(X, Y, T3, 2, D.atlantis).dither(X, Y + 2, T3, 1, null, D.atlantis, .5);
  S.vgrad(X, Y + 33, T3, 6, null, D.dell).rect(X, Y + 39, T3, 9, D.dell).dither(X, Y + 45, T3, 3, null, D.opal, .25);
  for (let i = 0; i < 15; i++) S.rect(X + Math.floor(tileHash(tx, ty, 300 + i) * 47), Y + 7 + Math.floor(tileHash(tx, ty, 320 + i) * 24), 1, 2, D.dell);
  for (let i = 0; i < 6; i++) S.rect(X + Math.floor(tileHash(tx, ty, 340 + i) * 47), Y + 5 + Math.floor(tileHash(tx, ty, 350 + i) * 16), 1, 2, D.atlantis);
  const n = tileHash(tx, ty, 1) < 0.4 ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const c = X + 3 * (Math.floor(tileHash(tx, ty, 10 + i) * 14) + 1), lean = tileHash(tx, ty, 360 + i) < .5 ? 0 : 1;
    if (tileHash(tx, ty, 20 + i) < 0.3) { S.set(c + 1 + lean, Y - 6, D.atlantis).rect(c + lean, Y - 5, 2, 2, D.atlantis).rect(c + 1, Y - 3, 2, 2, D.atlantis).rect(c, Y - 1, 3, 1, D.atlantis); }
    else { S.set(c + 1 + lean, Y - 3, D.atlantis).rect(c + lean, Y - 2, 2, 1, D.atlantis).rect(c, Y - 1, 3, 1, D.atlantis); }
  }
  if (tileHash(tx, ty, 100) < 0.2) {
    const fx = X + 3 * (1 + Math.floor(tileHash(tx, ty, 101) * 14));
    S.rect(fx + 1, Y - 6, 1, 6, D.eltGreen).rect(fx + 2, Y - 6, 1, 6, D.dell);
    if (tileHash(tx, ty, 102) < 0.5) S.rect(fx + 1, Y - 9, 4, 1, D.clairvoyant).rect(fx, Y - 8, 6, 1, D.clairvoyant).rect(fx + 1, Y - 7, 4, 1, D.clairvoyant).rect(fx + 2, Y - 9, 2, 1, D.brown).set(fx + 2, Y - 8, D.pancho);
    else S.rect(fx + 1, Y - 9, 1, 3, D.clairvoyant).rect(fx, Y - 8, 3, 1, D.clairvoyant).set(fx + 1, Y - 8, D.brown);
  }
};
H.dirt = function (S, X, Y, tx, ty) {
  S.rect(X, Y, T3, T3, D.oiledCedar);
  const sy = Y + 3 * (2 + Math.floor(tileHash(tx, ty, 70) * 10));
  for (let x = 0; x < T3; x++) S.rect(X + x, sy + Math.round(Math.sin((X + x) * 0.18 + tx) * 1), 1, 2, D.loulou);
  for (let i = 0; i < 20; i++) { const x = X + 2 + Math.floor(tileHash(tx, ty, 400 + i) * 43), y = Y + 3 + Math.floor(tileHash(tx, ty, 430 + i) * 42); S.rect(x, y, 2, 1, D.loulou); }
  for (let i = 0; i < 9; i++) { const x = X + 2 + Math.floor(tileHash(tx, ty, 460 + i) * 43), y = Y + 3 + Math.floor(tileHash(tx, ty, 480 + i) * 42); S.rect(x, y, 2, 1, D.rope).rect(x, y + 1, 2, 1, D.loulou); }
  if (tileHash(tx, ty, 80) < 0.35) { const px = X + 3 * (2 + Math.floor(tileHash(tx, ty, 81) * 10)), py = Y + 3 * (4 + Math.floor(tileHash(tx, ty, 82) * 8)); S.rect(px, py + 6, 6, 1, D.loulou); S.disc(px + 3, py + 3, 3.2, D.topaz); S.rect(px + 1, py, 4, 1, D.heather).rect(px, py + 1, 2, 2, D.heather).set(px + 2, py + 1, D.lightSteel); S.rect(px + 2, py + 5, 3, 1, D.dimGray); }
};
// Brick shader: a pixel's colour from its position inside a 24×24 fine brick (running bond, world-aligned).
// mortar 2 fine (lo) + 1 fine bevel (mid) on right/bottom; lit top: 1 fine hi + 1 fine 50 %; lower face shaded to mid.
function brick(S, X, Y, pal, chips) {
  const mid = (x, y) => pal.mid != null ? pal.mid : (bayer(x, y) < .5 ? pal.lo : pal.base);
  for (let j = 0; j < T3; j++) for (let i = 0; i < T3; i++) {
    const wx = X + i, wy = Y + j, row = Math.floor(wy / 24), off = (row & 1) ? 12 : 0, bx = ((wx - off) % 24 + 24) % 24, by = wy % 24;
    let c = pal.base;
    if (bx >= 22 || by >= 22) c = pal.lo; else if (bx === 21 || by === 21) c = mid(wx, wy);
    else if (by <= 1) c = bx === 20 ? pal.base : pal.hi;
    else if (by === 20 && bx > 0) c = mid(wx, wy);
    S.set(wx, wy, c);
    if (chips && bx < 19 && by > 3 && by < 15) { const bi = Math.floor((wx - off) / 24), h = tileHash(bi, row, 500); if (h < .5) { const cx = 3 + Math.floor(tileHash(bi, row, 501) * 14), cy = 4 + Math.floor(tileHash(bi, row, 502) * 9); if ((bx === cx || bx === cx + 1) && by === cy) S.set(wx, wy, mid(wx, wy)); if ((bx === cx || bx === cx + 1) && by === cy + 1) S.set(wx, wy, pal.hi); } }
  }
}
H.stone = function (S, X, Y, tx, ty) { brick(S, X, Y, {base: D.heather, hi: D.lightSteel, mid: D.topaz, lo: D.dimGray}, true); if (tileHash(tx, ty, 110) < 0.18) { const cx = X + 3 * (2 + Math.floor(tileHash(tx, ty, 111) * 12)), cy = Y + 3 * (2 + Math.floor(tileHash(tx, ty, 112) * 12)); S.set(cx, cy, D.dimGray).set(cx + 1, cy + 1, D.dimGray).set(cx + 1, cy + 2, D.dimGray).set(cx + 2, cy + 3, D.dimGray).set(cx, cy + 1, D.lightSteel).set(cx, cy + 2, D.lightSteel); } };
H.castleBrick = function (S, X, Y, tx, ty) { brick(S, X, Y, {base: D.dimGray, hi: D.heather, mid: D.verdigris, lo: D.valhalla}, true); if (tileHash(tx, ty, 130) < 0.12) { const rx = X + 3 * (3 + Math.floor(tileHash(tx, ty, 131) * 10)), ry = Y + 3 * (3 + Math.floor(tileHash(tx, ty, 132) * 10)); S.rect(rx, ry, 3, 3, D.valhalla).set(rx, ry, D.heather).set(rx + 2, ry + 2, D.black); } };
H.cryptBrick = function (S, X, Y, tx, ty) { brick(S, X, Y, {base: SHIPPED.cryptWall, hi: SHIPPED.cryptHi, mid: null, lo: SHIPPED.cryptLo}, false); if (tileHash(tx, ty, 150) < 0.08) { const cx = X + 3 * (2 + Math.floor(tileHash(tx, ty, 151) * 12)), cy = Y + 3 * (2 + Math.floor(tileHash(tx, ty, 152) * 12)); S.set(cx + 1, cy, D.white).set(cx + 1, cy + 1, D.white).set(cx, cy + 1, SHIPPED.cryptHi).set(cx + 2, cy + 1, SHIPPED.cryptHi); } };
H.ladder = function (S, X, Y) { for (const rx of [6, 36]) S.rect(X + rx, Y, 6, T3, D.rope).rect(X + rx, Y, 1, T3, D.twine).rect(X + rx + 1, Y, 1, T3, D.twine).rect(X + rx + 5, Y, 1, T3, D.oiledCedar); for (const ry of [9, 33]) S.rect(X + 12, Y + ry, 24, 2, D.twine).rect(X + 12, Y + ry + 2, 24, 2, D.rope).rect(X + 12, Y + ry + 4, 24, 2, D.oiledCedar).set(X + 12, Y + ry + 4, D.loulou); };
// Water. Surface band: 2 fine meniscus, 50 % seam, 2 fine sheen, 50 % seam, body. Depth darkens the body by dither.
// off: fine offset of the whole surface (-3..3); wave: 0..1 amplitude of a 1-fine travelling ripple; t: seconds.
H.water = function (S, X, Y, tx, ty, surface, depth, off, wave, t) {
  for (let i = 0; i < T3; i++) {
    const wx = X + i, top = surface ? Y + 6 + off + Math.round(Math.sin(wx * 0.26 - t * 5) * wave) : Y;
    for (let y = top; y < Y + T3; y++) {
      const k = y - top; let c = D.venice;
      if (surface) { if (k < 2) c = D.cornflower; else if (k === 2) c = bayer(wx, y) < .5 ? D.cornflower : D.royalBlue; else if (k < 5) c = D.royalBlue; else if (k < 7) c = bayer(wx, y) < .5 ? D.royalBlue : D.venice; }
      if (c === D.venice) { const dd = (depth * T3 + (y - Y)) / 160; if (bayer(wx, y) < Math.min(.5, dd * .5)) c = D.deepKoamaru; }
      S.set(wx, y, c);
    }
  }
  if (surface && tileHash(tx, ty, 200) < 0.3) { const sx = X + 3 * (2 + Math.floor(tileHash(tx, ty, 201) * 12)), sy = Y + 6 + off + 6 + Math.round(Math.sin(sx * 0.26 - t * 5) * wave); S.rect(sx, sy, 2, 1, D.lightSteel).set(sx + 2, sy, D.cornflower); }
};
H.tile = function (S, t, X, Y, tx, ty) { ({[T.Grass]:H.grass,[T.Dirt]:H.dirt,[T.Stone]:H.stone,[T.CastleBrick]:H.castleBrick,[T.CryptBrick]:H.cryptBrick,[T.Ladder]:H.ladder})[t](S, X, Y, tx, ty); };

// ---------------------------------------------------------------- PARALLAX
// Ridge rasterised per FINE column from the same polygon. Rim = the 3 fine above the ridge.
// Slopes facing the light get a full 3-fine rim plus a dithered fall-off under it; slopes facing away keep 1 fine.
H.hills = function (S, o, light = -1) {
  const p = hillPoints(o), base = (o.baseY ?? o.horizonY) * 3, lo = o.loColor;
  for (let fx = 0; fx < o.width * 3; fx++) {
    const lx = (fx + .5) / 3, r = ridgeAt(p, lx) * 3, y0 = Math.ceil(r - .5), slope = ridgeAt(p, lx + .5) - ridgeAt(p, lx - .5), lit = slope * light > 0.05;
    S.rect(fx, y0, 1, base - y0, o.color);
    if (o.rimColor !== undefined) {
      if (lit) { S.rect(fx, y0 - 3, 1, 3, o.rimColor); for (let k = 0; k < 2; k++) if (bayer(fx, y0 + k) < .5) S.set(fx, y0 + k, o.rimColor); }
      else { S.set(fx, y0 - 3, o.rimColor); S.rect(fx, y0 - 2, 1, 2, o.color); }
    }
  }
};
H.meadowSky = function (S) { S.rect(0, 0, 960, 384, SHIPPED.sky); };
H.nightSky = function (S) { S.rect(0, 0, 960, 672, D.valhalla).dither(0, 492, 960, 3, null, D.deepKoamaru, .25).dither(0, 495, 960, 3, null, D.deepKoamaru, .5).dither(0, 498, 960, 3, null, D.deepKoamaru, .75).rect(0, 501, 960, 171, D.deepKoamaru); };
H.stars = function (S, list) { for (const s of list) { const x = s.x * 3, y = s.y * 3; if (s.bright) { S.rect(x - 3, y + 1, 9, 1, D.heather).rect(x + 1, y - 3, 1, 9, D.heather).rect(x - 1, y + 1, 5, 1, D.lightSteel).rect(x + 1, y - 1, 1, 5, D.lightSteel).rect(x, y + 1, 3, 1, D.white).rect(x + 1, y, 1, 3, D.white).rect(x + 1, y + 1, 1, 1, D.white); } else S.rect(x + 1, y + 1, 2, 2, s.c); } };
H.moon = function (S) {
  const cx = 252 * 3 + 1.5, cy = 38 * 3 + 1.5;
  S.disc(cx, cy, 37.5, D.deepKoamaru); S.forInk((x, y) => { if (Math.hypot(x + .5 - cx, y + .5 - cy) > 34.5 && bayer(x, y) < .5) S.clr(x, y); });
  S.disc(cx, cy, 31.5, D.lightSteel).disc(cx, cy, 28.5, D.pancho);
  S.forInk((x, y, c) => { const d = Math.hypot(x + .5 - cx + 18, y + .5 - cy); if (d <= 28.5) S.set(x, y, D.valhalla); else if (c === D.pancho && d < 32 && bayer(x, y) < .5) S.set(x, y, D.twine); });
  S.disc(cx + 15, cy - 9, 3.4, D.twine).rect(cx + 12, cy - 12, 2, 1, D.rope).disc(cx + 19.5, cy + 10.5, 1.8, D.twine).disc(cx + 6, cy + 18, 1.5, D.twine);
};
