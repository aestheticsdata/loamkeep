'use strict';
const SW = 960, SH = 672;
const stage = document.getElementById('stage'), sctx = stage.getContext('2d');
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
const [bufA, ctxA] = mk(SW, SH), [bufB, ctxB] = mk(SW, SH);
sctx.imageSmoothingEnabled = false;
const st = {mode: 'hd', page: 1, fine: true, t: 0, user: false};
const keys = new Set(), pressed = new Set(), released = new Set();
const MOVE = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w'];
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); if (MOVE.includes(k)) e.preventDefault();
  if (e.repeat) return; pressed.add(k); keys.add(k);
  if (k === 'c') st.mode = st.mode === 'classic' ? 'hd' : 'classic';
  if (k === 'v') st.mode = st.mode === 'split' ? 'hd' : 'split';
  if (k === 'm') st.fine = !st.fine;
  if ('12345'.includes(k)) st.page = +k;
  if (MOVE.includes(k)) st.user = true;
  syncUI();
});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys.delete(k); released.add(k); });
const memo = new Map(); const M = (k, fn) => { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); };
const has = (...k) => k.some(x => keys.has(x));

// ---------------------------------------------------------------- the meadow
const LW = 40, LH = 14, map = new Array(LW * LH).fill(0);
const setT = (x, y, t) => map[y * LW + x] = t;
const tAt = (x, y) => (x < 0 || x >= LW || y >= LH) ? T.Stone : (y < 0 ? 0 : map[y * LW + x]);
const solid = (x, y) => [T.Grass, T.Dirt, T.Stone].includes(tAt(x, y));
for (let x = 0; x < LW; x++) { setT(x, 8, T.Grass); setT(x, 9, T.Dirt); for (let y = 10; y < LH; y++) setT(x, y, T.Stone); }
for (let x = 12; x < 16; x++) { setT(x, 6, T.Grass); setT(x, 7, T.Dirt); setT(x, 8, T.Dirt); }
for (let x = 24; x < 28; x++) setT(x, 4, T.Grass);
const LVL = {
  c: (() => { const g = new G(); for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if (map[y * LW + x]) C.tile(g, map[y * LW + x], x * 16, y * 16, x, y); return g.toCanvas(0, 0, LW * 16, 224); })(),
  h: (() => { const S = new F(0, 0, LW * 48, 672); for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if (map[y * LW + x]) H.tile(S, map[y * LW + x], x * 48, y * 48, x, y); return S.canvas(); })(),
};
const LO = {[D.heather]: D.topaz, [D.opal]: D.valhalla};
const MEADOW = MEADOW_HILLS(LW * 16).map(o => ({f: o.f, c: cg(C.hills, o).toCanvas(0, 0, LW * 16, 128), h: (() => { const S = new F(0, 0, LW * 48, 384); H.hills(S, {...o, loColor: LO[o.color]}); return S.canvas(); })()}));
const SKY = {c: (() => { const [c, x] = mk(960, 384); x.fillStyle = css(SHIPPED.sky); x.fillRect(0, 0, 960, 384); return c; })(), h: (() => { const S = new F(0, 0, 960, 384); H.meadowSky(S); return S.canvas(); })()};

const snail = {x: 60, y: 128, min: 40, max: 112, face: 1, el: 0};
const hare = {x: 330, y: 128, min: 300, max: 470, face: 1, timer: (330 * 0.013) % 1.6, bounds: 0, hop: 0, ear: 0};
const PLANTS = [[C.bush, 'bush', 168, 128], [C.smallTree, 'smallTree', 140, 128], [C.smallTree, 'smallTree', 204, 96], [C.bush, 'bush', 236, 96], [C.pine, 'pine', 420, 64], [C.pine, 'pine', 520, 128], [C.smallTree, 'smallTree', 552, 128]];
const P = {x: 40, y: 112, vx: 0, vy: 0, ground: false, face: 1, t: 0, phase: 0, auto: 1, autoJ: 2};
let camX = 0, acc = 0;

function physics(dt) {
  P.t += dt;
  let move = 0, jumpPress = false, jumpHeld = false;
  if (st.user) { if (has('arrowleft', 'a')) move -= 1; if (has('arrowright', 'd')) move += 1; jumpPress = ['arrowup', ' ', 'w'].some(k => pressed.has(k)); jumpHeld = has('arrowup', ' ', 'w'); }
  else { if (P.x > 590) P.auto = -1; if (P.x < 24) P.auto = 1; move = P.auto; P.autoJ -= dt; const ahead = Math.floor((P.x + 6 + P.auto * 10) / 16); if (P.ground && (solid(ahead, Math.floor((P.y + 8) / 16)) || P.autoJ < 0)) { jumpPress = true; P.autoJ = 2.5 + Math.random() * 2; } jumpHeld = P.vy < 0; }
  if (move) P.face = move;
  P.vx = move * 72;
  if (P.ground && jumpPress) P.vy = -300;
  if (P.vy < 0 && !jumpHeld && P.wasHeld) P.vy *= 0.5;
  P.wasHeld = jumpHeld;
  P.vy = Math.min(450, P.vy + 700 * (P.vy > 0 ? 1.6 : 1) * dt);
  P.x += P.vx * dt;
  const rowsY = [Math.floor(P.y / 16), Math.floor((P.y + 15) / 16)];
  if (P.vx > 0) { const tx = Math.floor((P.x + 11) / 16); if (rowsY.some(r => solid(tx, r))) P.x = tx * 16 - 12; }
  if (P.vx < 0) { const tx = Math.floor(P.x / 16); if (rowsY.some(r => solid(tx, r))) P.x = tx * 16 + 16; }
  P.y += P.vy * dt; P.ground = false;
  const cols = [Math.floor((P.x + 1) / 16), Math.floor((P.x + 10) / 16)];
  if (P.vy >= 0) { const ty = Math.floor((P.y + 16) / 16); if (cols.some(c => solid(c, ty))) { P.y = ty * 16 - 16; P.vy = 0; P.ground = true; } }
  else { const ty = Math.floor(P.y / 16); if (cols.some(c => solid(c, ty))) { P.y = ty * 16 + 16; P.vy = 0; } }
  P.phase = P.ground && P.vx !== 0 ? Math.sin(P.t * 8) : 0;
  pressed.clear(); released.clear();
}
function critters(dt) {
  snail.el += dt; snail.x += snail.face * 2.5 * dt;
  if (snail.x <= snail.min || snail.x >= snail.max) { snail.x = Math.max(snail.min, Math.min(snail.max, snail.x)); snail.face *= -1; }
  hare.timer -= dt; hare.hop = 0;
  if (hare.bounds > 0) {
    hare.x += hare.face * 70 * dt;
    if (hare.x <= hare.min || hare.x >= hare.max) { hare.x = Math.max(hare.min, Math.min(hare.max, hare.x)); hare.face *= -1; }
    hare.hop = Math.sin((1 - Math.max(0, hare.timer) / 0.28) * Math.PI) * 5;
    if (hare.timer <= 0) { hare.bounds -= 1; hare.timer = hare.bounds > 0 ? 0.28 : 1.6; }
  } else if (hare.timer <= 0) { hare.bounds = 4; hare.timer = 0.28; if (Math.random() < 0.4) hare.face *= -1; }
  hare.ear = hare.bounds === 0 && hare.timer % 1.1 < 0.15 ? 1 : 0;
}
// positions land on FINE px in both modes (the stage already rounds to screen px); only the drawings differ.
const fx = v => Math.round(v * 3);
function drawSprite(ctx, hd, classicG, hdF, x, y, mirror) { if (hd) [].concat(hdF).forEach(f => f.blit(ctx, x, y, mirror)); else classicG.draw(ctx, x, y, 3, mirror); }
function figurePoses() {
  const walking = P.ground && P.vx !== 0, s = Math.round(P.phase);
  const c = {airborne: !P.ground, swimming: false, stepOffset: s, bodyBob: walking ? -Math.abs(s) : 0, swimPhase: 0};
  let h = H.poseFromClassic(c);
  if (st.fine) { const sf = Math.round(P.phase * 3); h = {...h, step: sf, bob: walking ? -Math.abs(sf) : 0}; }
  return {c, h};
}
const hdFig = h => M('fig' + JSON.stringify(h), () => H.figure(h));
function renderMeadow(ctx, hd) {
  const k = hd ? 'h' : 'c';
  ctx.drawImage(SKY[k], 0, 0);
  for (const L of MEADOW) ctx.drawImage(L[k], -Math.round(camX * L.f * 3), 0);
  ctx.drawImage(LVL[k], -fx(camX), 0);
  for (const [fn, name, x, y] of PLANTS) drawSprite(ctx, hd, cg(fn), M('plant' + name, () => H.plant(fn)), fx(x - camX), fx(y), false);
  const sf = Math.floor(snail.el * 1.5) & 1;
  drawSprite(ctx, hd, cg(C.snail, sf), M('snail' + sf, () => H.snail(sf)), fx(snail.x - camX), fx(snail.y), snail.face < 0);
  const hp = {bounding: hare.bounds > 0, ear: hare.ear}, hop = hd && st.fine ? Math.round(hare.hop * 3) : Math.round(hare.hop) * 3;
  drawSprite(ctx, hd, cg(C.hare, hp), M('hare' + JSON.stringify(hp), () => H.hare(hp)), fx(hare.x - camX), fx(hare.y) - hop, hare.face < 0);
  const {c, h} = figurePoses();
  drawSprite(ctx, hd, cg(C.figure, c), hdFig(hd ? h : H.poseFromClassic(c)), fx(P.x + 6 - camX), fx(P.y + 16), P.face < 0);
}

// ---------------------------------------------------------------- shared panel bits
let chrome = [];
const label = (s, x, y, c = D.pancho, dot = 2) => chrome.push([s, x, y, c, dot]);
function loupe(ctx, buf, sx, sy, sw, sh, dx, dy, z) { ctx.drawImage(buf, sx, sy, sw, sh, dx, dy, sw * z, sh * z); ctx.strokeStyle = css(D.valhalla); ctx.lineWidth = 2; ctx.strokeRect(dx - 1, dy - 1, sw * z + 2, sh * z + 2); }
const fill = (ctx, c, x, y, w, h) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, w, h); };
const fpTag = n => n === 0 ? 'fp ok' : 'fp ' + n + ' off';

// ---------------------------------------------------------------- page 2: figure + creatures
const base = {airborne: false, swimming: false, stepOffset: 0, bodyBob: 0, swimPhase: 0};
const POSES = [
  ['IDLE', base], ['WALK +1', {...base, stepOffset: 1, bodyBob: -1}], ['WALK -1', {...base, stepOffset: -1, bodyBob: -1}],
  ['WALK 2/3', {...base, stepOffset: 1, bodyBob: -1}, {step: 2, bob: -2}],
  ['JUMP', {...base, airborne: true}], ['CLIMB 0', {...base, climbing: true, climbPhase: 0}], ['CLIMB 1', {...base, climbing: true, climbPhase: 1}],
  ['SWIM -1', {...base, swimming: true, swimPhase: -1}], ['SWIM 0', {...base, swimming: true, swimPhase: 0}], ['SWIM +1', {...base, swimming: true, swimPhase: 1}],
].map(([name, c, fine]) => { const h = {...H.poseFromClassic(c), ...(fine || {})}; return {name, c, h, fp: fine ? null : footprint(cg(C.figure, c), H.figure(h))}; });
const GF = [{tail: 0, glow: 0.25}, {tail: 1, glow: 1}];
const FP = {
  snail: [0, 1].map(f => footprint(cg(C.snail, f), H.snail(f))),
  hare: [{bounding: false, ear: 0}, {bounding: false, ear: 1}, {bounding: true, ear: 0}].map(p => footprint(cg(C.hare, p), H.hare(p))),
  fish: GF.map(f => { const g = new G(); C.glowfish(g, f); return footprint(g, H.glowfish(f).body); }),
  fishL: footprint(cg(C.glowfishLarge), H.glowfishLarge().body),
  moth: [0, 1].map(f => footprint(cg(C.moth, f), H.moth(f))),
  mothL: footprint(cg(C.mothLarge), H.mothLarge()),
  plants: ['bush', 'smallTree', 'pine'].map(n => footprint(cg(C[n]), H.plant(C[n]))),
};
console.log('footprint (0 = matches classic):', JSON.stringify({figure: POSES.map(p => p.fp), ...FP}));
const LADDER_H = M('ladderH', () => { const S = new F(0, 0, 48, 96); H.ladder(S, 0, 0); H.ladder(S, 0, 48); return S; });
const DEEP_H = M('deepH', () => { const S = new F(0, 0, 92, 100); H.water(S, 0, 0, 0, 1, false, 1, 0, 0, 0); H.water(S, 48, 0, 1, 1, false, 1, 0, 0, 0); H.water(S, 0, 48, 0, 2, false, 2, 0, 0, 0); H.water(S, 48, 48, 1, 2, false, 2, 0, 0, 0); return S; });
function renderCreatures(ctx, hd, buf) {
  fill(ctx, SHIPPED.sky, 0, 0, 960, 300);
  POSES.forEach((p, i) => {
    const x0 = 28 + i * 92, ax = x0 + 44, ay = 120;
    if (p.c.climbing) { if (hd) LADDER_H.blit(ctx, ax - 24, ay - 96); else { const g = new G(); C.ladder(g, 0, 0); C.ladder(g, 0, 16); g.draw(ctx, ax - 24, ay - 96); } }
    if (p.c.swimming) { if (hd) DEEP_H.blit(ctx, x0, ay - 84); else fill(ctx, D.venice, x0, ay - 84, 92, 100); }
    drawSprite(ctx, hd, cg(C.figure, p.c), hdFig(p.h), ax, ay, false);
    loupe(ctx, buf, ax - 22, ay - 54, 44, 57, x0, 140, 2);
  });
  const cols = [SHIPPED.sky, SHIPPED.sky, D.venice, SHIPPED.grotto];
  cols.forEach((c, i) => fill(ctx, c, i * 240, 300, 240, 372));
  // snail
  [0, 1].forEach((f, i) => { const ax = 60 + i * 110, ay = 372; drawSprite(ctx, hd, cg(C.snail, f), M('snail' + f, () => H.snail(f)), ax, ay, false); loupe(ctx, buf, ax - 15, ay - 27, 33, 30, 12 + i * 113, 392, 3); });
  // hare
  [{bounding: false, ear: 0}, {bounding: false, ear: 1}, {bounding: true, ear: 0}].forEach((p, i) => { const ax = 280 + i * 80, ay = 380; drawSprite(ctx, hd, cg(C.hare, p), M('hare' + JSON.stringify(p), () => H.hare(p)), ax, ay, false); loupe(ctx, buf, ax - 19, ay - 45, 38, 48, 242 + i * 80, 396, 2); });
  // glowfish
  GF.forEach((f, i) => { const ax = 540 + i * 110, ay = 368, s = M('gf' + i, () => H.glowfish(f)); drawSprite(ctx, hd, cg(C.glowfish, f), [s.halo, s.body], ax, ay, false); loupe(ctx, buf, ax - 26, ay - 24, 52, 32, 488 + i * 116, 392, 2); });
  { const ax = 540, ay = 532, s = M('gfL', () => H.glowfishLarge()); drawSprite(ctx, hd, cg(C.glowfishLarge), [s.halo, s.body], ax, ay, false); loupe(ctx, buf, ax - 45, ay - 42, 90, 48, 616, 520, 1.5); }
  // moth
  [0, 1].forEach((f, i) => { const ax = 780 + i * 110, ay = 364; drawSprite(ctx, hd, cg(C.moth, f), M('moth' + f, () => H.moth(f)), ax, ay, false); loupe(ctx, buf, ax - 12, ay - 15, 24, 18, 744 + i * 110, 386, 3); });
  { const ax = 784, ay = 530; drawSprite(ctx, hd, cg(C.mothLarge), M('mothL', () => H.mothLarge()), ax, ay, false); loupe(ctx, buf, ax - 24, ay - 33, 48, 36, 834, 500, 2.5); }
}
function chromeCreatures() {
  label('THE FIGURE  12x16   classic frames, + one HD in-between', 28, 10, D.valhalla);
  POSES.forEach((p, i) => { const x0 = 28 + i * 92; label(p.name, x0, 260, D.valhalla); label(p.fp == null ? 'HD only' : fpTag(p.fp), x0, 280, p.fp ? D.clairvoyant : D.venice); });
  label('SNAIL 10x7', 12, 310, D.valhalla); FP.snail.forEach((n, i) => label(fpTag(n), 12 + i * 113, 486, n ? D.clairvoyant : D.venice));
  label('HARE 12x13', 252, 310, D.valhalla); ['sit', 'ear', 'hop'].forEach((s, i) => label(s, 246 + i * 80, 496, D.valhalla)); FP.hare.forEach((n, i) => label(fpTag(n), 246 + i * 80, 516, n ? D.clairvoyant : D.venice));
  label('GLOWFISH', 492, 310); FP.fish.forEach((n, i) => label(fpTag(n), 488 + i * 116, 460)); label('portrait 24x14', 492, 486); label(fpTag(FP.fishL), 492, 640);
  label('MOTH 7x4', 744, 310); FP.moth.forEach((n, i) => label(fpTag(n), 744 + i * 110, 446)); label('portrait 15x10', 744, 474); label(fpTag(FP.mothL), 744, 640);
}

// ---------------------------------------------------------------- page 3: tiles + type
const TILES = [['GRASS', T.Grass], ['DIRT', T.Dirt], ['STONE', T.Stone], ['CASTLE', T.CastleBrick], ['CRYPT', T.CryptBrick], ['WATER', T.Water]];
const SAMPLE = "Whoa, slow down! Where's the fire? I've been on this rock since Tuesday.";
function renderTiles(ctx, hd, buf) {
  fill(ctx, D.valhalla, 0, 0, 960, 672);
  TILES.forEach(([n, t], i) => {
    const sx = 24 + i * 156, sy = 60;
    if (t === T.Water) {
      const off = Math.round(Math.sin(st.t * 3) * (hd && st.fine ? 3 : 1));
      if (hd) { const S = new F(0, 0, 96, 96); for (let k = 0; k < 2; k++) { H.water(S, k * 48, 0, k, 1, true, 0, hd && st.fine ? off : off * 3, 1, st.t); H.water(S, k * 48, 48, k, 2, false, 1, 0, 0, 0); } S.blit(ctx, sx, sy); }
      else { const g = new G(); for (let k = 0; k < 2; k++) { C.water(g, k * 16, 0, k, 1, true, off); C.water(g, k * 16, 16, k, 2, false, 0); } g.draw(ctx, sx, sy); }
    } else if (hd) M('tileH' + t, () => { const S = new F(0, -9, 96, 105); for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) H.tile(S, t, k * 48, j * 48, i * 2 + k, 8 + j); return S; }).blit(ctx, sx, sy);
    else { const g = new G(); for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) C.tile(g, t, k * 16, j * 16, i * 2 + k, 8 + j); g.draw(ctx, sx, sy); }
    loupe(ctx, buf, sx, sy - 6, 48, 54, sx, 176, 2);
  });
  // type
  fill(ctx, D.loulou, 24, 340, 440, 60);
  if (hd) M('menuH', () => { const S = new F(0, 0, 440, 40); menuHD(S, 'ENTER THE MEADOW', 12, 9, D.pancho, D.oiledCedar); return S; }).blit(ctx, 24, 340);
  else { const g = new G(); eachDot('ENTER THE MEADOW', MENU, (x, y) => g.rect(x, y, 1, 1).fill(D.pancho)); g.draw(ctx, 36, 349); }
  loupe(ctx, buf, 30, 344, 100, 30, 24, 420, 4.4);
  fill(ctx, D.pancho, 496, 340, 440, 300);
  if (hd) { textCtx(ctx, 'Snail', 516, 356, D.valhalla, 3); wrap(SAMPLE, 30).forEach((l, i) => textCtx(ctx, l, 516, 404 + i * 30, D.valhalla, 2)); textCtx(ctx, 'abcdefghijklmnopqrstuvwxyz', 516, 512, D.oiledCedar, 2); textCtx(ctx, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 516, 542, D.oiledCedar, 2); textCtx(ctx, "0123456789 .,!?'-:[]()/", 516, 572, D.oiledCedar, 2); }
  else { ctx.fillStyle = css(D.valhalla); ctx.textBaseline = 'top'; ctx.font = 'bold 42px monospace'; ctx.fillText('Snail', 516, 350); ctx.font = '27px monospace'; classicWrap(ctx, SAMPLE, 390).forEach((l, i) => ctx.fillText(l, 516, 404 + i * 39)); ctx.fillStyle = css(D.oiledCedar); ctx.fillText('abcdefghijklmnopqrstuvwxyz', 516, 530); ctx.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 516, 562); }
  loupe(ctx, buf, 516, 404, 84, 24, 516, 600, 3);
}
function classicWrap(ctx, s, w) { const out = []; let line = ''; for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } out.push(line); return out; }
function chromeTiles() {
  label('TILES 16x16   2x2 at play size, one tile at x2 below', 24, 16);
  TILES.forEach(([n], i) => label(n, 24 + i * 156, 296));
  label('MENU FONT 5x7 on the fine grid', 24, 318); label('BOOK FONT  dot 2, 6-dot advance', 496, 318);
}

// ---------------------------------------------------------------- page 4: belfry night
const NW = 960;
const NIGHT = (() => {
  const stars = starList(NW, 0x5eed);
  const hills = NIGHT_HILLS(NW).map(o => ({f: o.f, c: cg(C.hills, {...o, baseY: 224}).toCanvas(0, 0, NW, 224), h: (() => { const S = new F(0, 0, NW * 3, 672); H.hills(S, {...o, baseY: 224, rimColor: undefined}, 1); return S.canvas(); })()}));
  return {
    sky: {c: cg(C.nightSky).toCanvas(0, 0, 320, 224), h: (() => { const S = new F(0, 0, 960, 672); H.nightSky(S); return S.canvas(); })()},
    stars: {c: cg(C.stars, stars).toCanvas(0, -42, NW, 230), h: (() => { const S = new F(0, -126, NW * 3, 690); H.stars(S, stars); return S.canvas(); })()},
    moon: {c: cg(C.moon).toCanvas(0, 0, 320, 224), h: (() => { const S = new F(0, 0, 960, 672); H.moon(S); return S.canvas(); })()},
    hills,
  };
})();
function renderNight(ctx, hd) {
  const k = hd ? 'h' : 'c', cx = 160 + Math.sin(st.t * 0.25) * 160;
  ctx.drawImage(NIGHT.sky[k], 0, 0);
  ctx.drawImage(NIGHT.stars[k], -Math.round(cx * 0.06 * 3), -126);
  ctx.drawImage(NIGHT.moon[k], -Math.round(cx * 0.03 * 3), 0);
  for (const L of NIGHT.hills) ctx.drawImage(L[k], -Math.round(cx * L.f * 3), 0);
}

// ---------------------------------------------------------------- page 5: sketchbook
const FX = 120, FY = 96, FW = 720, FH = 480;
function castleBg(hd) { if (!hd) { const g = new G(); for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) C.tile(g, T.CastleBrick, x * 16, y * 16, x, y); return g; } const S = new F(0, 0, 960, 672); for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) H.tile(S, T.CastleBrick, x * 48, y * 48, x, y); return S; }
const SKETCH = {
  c: (() => {
    const [cv, x] = mk(960, 672); castleBg(false).draw(x, 0, 0); x.globalAlpha = 0.7; fill(x, D.valhalla, 0, 0, 960, 672); x.globalAlpha = 1;
    fill(x, D.pancho, FX, FY, FW, FH); x.fillStyle = css(D.oiledCedar); x.fillRect(FX - 3, FY - 3, FW + 6, 6); x.fillRect(FX - 3, FY + FH - 3, FW + 6, 6); x.fillRect(FX - 3, FY - 3, 6, FH + 6); x.fillRect(FX + FW - 3, FY - 3, 6, FH + 6);
    x.fillStyle = css(D.valhalla); x.textBaseline = 'top'; x.font = 'bold 42px monospace'; x.fillText('Snail', FX + 36, FY + 30);
    fill(x, D.oiledCedar, FX + 36, FY + 96, FW - 72, 3);
    const g = new G(); g.setTransform(5, 0, 0, 5, 0, -Math.round(-3.5 * 5)); C.snail(g, 0); g.draw(x, FX + 150, FY + 330);
    x.fillStyle = css(D.valhalla); x.font = '27px monospace'; classicWrap(x, SAMPLE, 390).forEach((l, i) => x.fillText(l, 450, 234 + i * 39));
    x.fillStyle = css(D.dimGray); x.font = '24px monospace'; const hint = '[ press E to close ]'; x.fillText(hint, FX + Math.round((FW - x.measureText(hint).width) / 2), 528);
    return cv;
  })(),
  h: (() => {
    const bg = castleBg(true); bg.forInk((px, py, c) => bg.set(px, py, loOf(loOf(c))));
    const S = new F(0, 0, 960, 672); bg.forInk((px, py, c) => S.set(px, py, c));
    // parchment + dithered vignette (stronger in the corners, where both edges add up)
    S.rect(FX, FY, FW, FH, D.pancho);
    S.dither(FX, FY, FW, FH, null, D.twine, (px, py) => { const ex = Math.min(px - FX, FX + FW - 1 - px), ey = Math.min(py - FY, FY + FH - 1 - py), v = Math.pow(Math.max(0, 1 - ex / 40), 1.6) + Math.pow(Math.max(0, 1 - ey / 40), 1.6); return Math.min(0.6, 0.45 * v); });
    // border: the classic 2-logical stroke = 6 fine: loulou | cedar ×3 | bevel (rope lit / loulou shade) | paper shadow
    const ring = (i, top, bot) => { const x = FX - 3 + i, y = FY - 3 + i, w = FW + 6 - 2 * i, h = FH + 6 - 2 * i; S.rect(x, y, w, 1, top).rect(x, y, 1, h, top).rect(x, y + h - 1, w, 1, bot).rect(x + w - 1, y, 1, h, bot); };
    ring(0, D.loulou, D.loulou); ring(1, D.oiledCedar, D.oiledCedar); ring(2, D.oiledCedar, D.oiledCedar); ring(3, D.oiledCedar, D.oiledCedar); ring(4, D.rope, D.loulou);
    S.dither(FX + 2, FY + 2, FW - 4, 2, null, D.rope, .5).dither(FX + 2, FY + 2, 2, FH - 4, null, D.rope, .5);
    // dog-ear, bottom-right
    const ox = FX + FW + 2, oy = FY + FH + 2, E = 42;
    for (let py = oy - 2 * E; py <= oy; py++) for (let px = ox - 2 * E; px <= ox; px++) { const dx = ox - px, dy = oy - py, s = dx + dy;
      if (dx < 0 || dy < 0) continue;
      if (s < E && dx <= E && dy <= E) S.set(px, py, bg.get(px, py));
      else if (dx <= E && dy <= E) { const k = s - E; S.set(px, py, k < 2 ? D.pancho : (dx >= E - 1 || dy >= E - 1) ? D.rope : bayer(px, py) < Math.min(.6, k / 60) ? D.rope : D.twine); }
      else if (dx <= E + 5 && dy <= E + 5 && s >= E && S.get(px, py) === D.pancho && bayer(px, py) < .5) S.set(px, py, D.twine);
    }
    textF(S, 'Snail', FX + 36, FY + 30, D.valhalla, 3);
    S.rect(FX + 36, FY + 96, FW - 72, 2, D.oiledCedar).rect(FX + 36, FY + 98, FW - 72, 1, D.twine).rect(FX + 36, FY + 96, 4, 3, null);
    S.dither(FX + 36, FY + 96, 12, 3, null, D.pancho, x => 1 - (x - FX - 36) / 12).dither(FX + FW - 48, FY + 96, 12, 3, null, D.pancho, x => (x - (FX + FW - 48)) / 12);
    S.dither(196, 470, 160, 10, null, D.twine, (px, py) => { const e = Math.hypot((px - 276) / 80, (py - 474) / 5); return e < 1 ? .55 : 0; });
    H.snailPortrait().forInk((px, py, c) => S.set(px + 276, py + 474, c));
    wrap(SAMPLE, 30).forEach((l, i) => textF(S, l, 450, 234 + i * 30, D.valhalla, 2));
    const hint = '[ press E to close ]'; textF(S, hint, FX + Math.round((FW - measure(hint, 2)) / 2), 528, D.dimGray, 2);
    return S.canvas();
  })(),
};
function renderSketch(ctx, hd) { ctx.drawImage(SKETCH[hd ? 'h' : 'c'], 0, 0); }

// ---------------------------------------------------------------- frame
const PAGES = {
  1: {name: 'Meadow', render: renderMeadow},
  2: {name: 'Figure & creatures', render: renderCreatures, chrome: chromeCreatures},
  3: {name: 'Tiles & type', render: renderTiles, chrome: chromeTiles},
  4: {name: 'Belfry night', render: renderNight},
  5: {name: 'Sketchbook', render: renderSketch},
};
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; st.t += dt;
  if (st.page === 1) { acc += dt; while (acc >= 1 / 60) { physics(1 / 60); critters(1 / 60); acc -= 1 / 60; } const target = Math.max(0, Math.min(LW * 16 - 320, P.x + 6 - 160)); camX += (target - camX) * (1 - Math.exp(-10 * dt)); }
  const pg = PAGES[st.page]; chrome = [];
  const need = st.mode === 'split' ? ['c', 'h'] : [st.mode === 'classic' ? 'c' : 'h'];
  if (need.includes('c')) { ctxA.clearRect(0, 0, SW, SH); pg.render(ctxA, false, bufA); }
  if (need.includes('h')) { ctxB.clearRect(0, 0, SW, SH); pg.render(ctxB, true, bufB); }
  if (st.mode === 'split') { sctx.drawImage(bufA, 0, 0, 480, SH, 0, 0, 480, SH); sctx.drawImage(bufB, 480, 0, 480, SH, 480, 0, 480, SH); fill(sctx, D.white, 479, 0, 2, SH); }
  else sctx.drawImage(st.mode === 'classic' ? bufA : bufB, 0, 0);
  pg.chrome && pg.chrome();
  for (const [s, x, y, c, dot] of chrome) textCtx(sctx, s, x, y, c, dot);
  const tag = (s, x) => { const w = measure(s, 2) + 16; fill(sctx, D.valhalla, x - (x > 480 ? w : 0), SH - 34, w, 28); textCtx(sctx, s, x - (x > 480 ? w : 0) + 8, SH - 28, D.pancho, 2); };
  if (st.mode === 'split') { tag('CLASSIC', 8); tag('HD', 952); } else tag(st.mode === 'classic' ? 'CLASSIC' : 'HD' + (st.fine ? '' : '  fine motion off'), 952);
  requestAnimationFrame(frame);
}
function syncUI() {
  document.querySelectorAll('[data-page]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.page === st.page));
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
  const fm = document.getElementById('fine'); if (fm) fm.setAttribute('aria-pressed', st.fine);
}
document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { st.page = +b.dataset.page; syncUI(); b.blur(); });
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; syncUI(); b.blur(); });
document.getElementById('fine').onclick = e => { st.fine = !st.fine; syncUI(); e.target.blur(); };
const qp = new URLSearchParams(location.search); if (qp.get('page')) st.page = +qp.get('page'); if (qp.get('mode')) st.mode = qp.get('mode');
syncUI(); requestAnimationFrame(frame);
