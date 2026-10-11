'use strict';
const SW = 960, SH = 672, TS = 16;
const stage = document.getElementById('stage'), sctx = stage.getContext('2d'); sctx.imageSmoothingEnabled = false;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
const [bufA, ctxA] = mk(SW, SH), [bufB, ctxB] = mk(SW, SH);
const st = {mode: 'hd', page: 1, fog: true, t: 0, sketch: 0, toast: null};
const keys = new Set(), pressed = new Set();
const memo = new Map(), M = (k, fn) => { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); };
const has = (...k) => k.some(x => keys.has(x));
const {W, H: MH, g: MAP, roomAt, rooms, lights, props, critters, landmarks} = SHED;
const R = SHED.reach;
const tileCh = (x, y) => (x < 0 || x >= W || y < 0 || y >= MH) ? 'j' : MAP[y][x];
const passable = (x, y) => !R.solid(x, y);

// ---------------------------------------------------------------- HD derivation for props & creatures
const EMIT = [D.goldenFizz, D.white, D.valhalla, D.black];
function grain(S) { const o = []; S.forInk((x, y, c) => { if ((c === D.rope || c === D.oiledCedar) && S.get(x - 1, y) === c && S.get(x + 1, y) === c && S.get(x, y - 1) === c && S.get(x, y + 1) === c && (y % 6 + 6) % 6 === 3 && tileHash(Math.floor(x / 5), y, 900) < .4) o.push(x, y, loOf(c)); }); S._apply(o); }
// Derived HD: classic ×3 → round → elbows → selout edges (emissive skipped) → wood grain / foliage.
// A translucent 1-px highlight in the classic (jar glass) becomes a 1-fine solid line — no alpha.
function hdOf(fn, ...args) { const g = cg(fn, ...args), S = up(g); S.round(); S.elbows(); S.edges(EMIT); grain(S); foliage(S, D.dell, D.eltGreen, D.opal); for (const o of g.ops) if (o.a < 1 && o.w === 1) S.rect(o.x * 3 + 1, o.y * 3, 1, o.h * 3, o.c); return S; }
const hdProp = name => M('P' + name, () => hdOf(P[name]));
function litCopy(S, steps) { if (!steps) return S; const T = new F(S.x0, S.y0, S.w, S.h); S.forInk((x, y, c) => { for (let i = 0; i < steps; i++) c = loOf(c); T.set(x, y, c); }); return T; }

// ---------------------------------------------------------------- per-tile ambient + room for backdrops
const amb = Array.from({length: MH}, () => Array(W).fill(0)), bdRoom = Array.from({length: MH}, () => Array(W).fill(-1));
for (let y = 0; y < MH; y++) for (let x = 0; x < W; x++) if (roomAt[y][x] >= 0) { amb[y][x] = rooms[roomAt[y][x]].amb; bdRoom[y][x] = roomAt[y][x]; }
for (let y = 0; y < MH; y++) for (let x = 0; x < W; x++) if (roomAt[y][x] < 0) { let best = 0, ri = -1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = (roomAt[y + dy] || [])[x + dx]; if (r != null && r >= 0 && rooms[r].amb > best) { best = rooms[r].amb; ri = r; } } amb[y][x] = best * 0.55; if (passable(x, y)) bdRoom[y][x] = ri; }
const nbOf = (x, y) => { let depth = 0; while (tileCh(x, y - depth - 1) === 'W') depth++; return {up: passable(x, y - 1) && tileCh(x, y - 1) !== 'W', down: passable(x, y + 1) && tileCh(x, y + 1) !== 'W', depth}; };
const PROPS = props.concat(landmarks.map(l => ({name: l.body, col: l.col, row: l.row})));
const propAnchor = p => [Math.round((p.col * TS + 8) * 3), Math.round(p.row * TS * 3)];

// ---------------------------------------------------------------- chunk bakes (20×14 tiles = one screen)
const CW = 20, CHH = 14, cache = {c: new Map(), h: new Map()};
function bakeClassic(cx, cy) {
  const [cv, x] = mk(SW, SH); const g = new G(), ox = cx * CW, oy = cy * CHH;
  for (let ty = oy; ty < oy + CHH; ty++) for (let tx = ox; tx < ox + CW; tx++) { const ch = tileCh(tx, ty); if (passable(tx, ty)) g.rect(tx * TS, ty * TS, TS, TS).fill(D.valhalla); if (ch !== '.') C.shedTile(g, ch, tx * TS, ty * TS, tx, ty, nbOf(tx, ty)); }
  g.draw(x, -ox * TS * 3, -oy * TS * 3, 3);
  for (const p of PROPS) { const [ax, ay] = propAnchor(p); if (ax < ox * 48 - 200 || ax > (ox + CW) * 48 + 200 || ay < oy * 48 - 300 || ay > (oy + CHH) * 48 + 300) continue; cg(P[p.name]).draw(x, ax - ox * 48, ay - oy * 48, 3); }
  return cv;
}
function bakeHD(cx, cy) {
  const ox = cx * CW * 48, oy = cy * CHH * 48, S = new F(ox, oy, SW, SH), back = new Uint8Array(SW * SH);
  for (let ty = cy * CHH; ty < (cy + 1) * CHH; ty++) for (let tx = cx * CW; tx < (cx + 1) * CW; tx++) {
    const ch = tileCh(tx, ty), X = tx * 48, Y = ty * 48;
    if (passable(tx, ty)) { const ri = bdRoom[ty][tx], r = ri >= 0 ? rooms[ri] : null, f = r ? BD[r.kind] : null; for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { S.set(X + i, Y + j, f ? f(X + i, Y + j, r) : D.black); back[(Y + j - oy) * SW + X + i - ox] = 1; } }
    if (ch !== '.') { H.shedTile(S, ch, X, Y, tx, ty, nbOf(tx, ty)); if (ch !== 'H') for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) back[(Y + j - oy) * SW + X + i - ox] = 0; }
  }
  for (const p of PROPS) { const [ax, ay] = propAnchor(p); if (ax < ox - 200 || ax > ox + SW + 200 || ay < oy - 300 || ay > oy + SH + 300) continue; hdProp(p.name).forInk((x, y, c) => { const px = ax + x, py = ay + y; if (px >= ox && py >= oy && px < ox + SW && py < oy + SH) { S.set(px, py, c); back[(py - oy) * SW + px - ox] = 0; } }); }
  const near = lights.filter(s => s.x + s.r > ox / 48 && s.x - s.r < (ox + SW) / 48 && s.y + s.r > oy / 48 && s.y - s.r < (oy + SH) / 48);
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const x = ox + i, y = oy + j, k = j * SW + i, c = S.b[k]; if (c === -1) continue; S.b[k] = lit(c, lightAt(x, y, amb, near), x, y);
    if (back[k]) for (const s of near) if (s.warm) { const d = Math.hypot(x / 48 - s.x, y / 48 - s.y) / s.r; if (d < .6 && bayer(x * 7 + 3, y * 5 + 1) < .1 * Math.pow(1 - d / .6, 2) && tileHash(x >> 1, y >> 1, 950) < .5) S.b[k] = d < .25 ? D.goldenFizz : D.tahitiGold; } }
  return S.canvas();
}
function chunk(mode, cx, cy) { const k = cx + ',' + cy, m = cache[mode]; if (!m.has(k)) { m.set(k, mode === 'h' ? bakeHD(cx, cy) : bakeClassic(cx, cy)); if (m.size > 18) m.delete(m.keys().next().value); } return m.get(k); }

// ---------------------------------------------------------------- the figure
const PL = {x: 0, y: 0, vx: 0, vy: 0, ground: false, face: 1, t: 0, phase: 0, climb: false, climbD: 0, swim: false, coyote: 0, buffer: 0};
function spawnAt(col, row) { PL.x = col * TS + 2; PL.y = row * TS; PL.vx = PL.vy = 0; PL.climb = false; }
spawnAt(SHED.spawns[0].col, SHED.spawns[0].row);
function collideX() { const rows = [Math.floor(PL.y / TS), Math.floor((PL.y + 15) / TS)]; if (PL.vx > 0) { const tx = Math.floor((PL.x + 11) / TS); if (rows.some(r => R.solid(tx, r))) PL.x = tx * TS - 12; } if (PL.vx < 0) { const tx = Math.floor(PL.x / TS); if (rows.some(r => R.solid(tx, r))) PL.x = tx * TS + TS; } }
function collideY() { PL.ground = false; const cols = [Math.floor((PL.x + 1) / TS), Math.floor((PL.x + 10) / TS)]; if (PL.vy >= 0) { const ty = Math.floor((PL.y + 16) / TS); if (cols.some(c => R.solid(c, ty))) { PL.y = ty * TS - 16; PL.vy = 0; PL.ground = true; } } else { const ty = Math.floor(PL.y / TS); if (cols.some(c => R.solid(c, ty))) { PL.y = ty * TS + TS; PL.vy = 0; } } }
function physics(dt) {
  PL.t += dt;
  const move = (has('arrowright', 'd') ? 1 : 0) - (has('arrowleft', 'a') ? 1 : 0), up = has('arrowup', ' ', 'w', 'z'), down = has('arrowdown', 's'), jumpP = ['arrowup', ' ', 'w', 'z'].some(k => pressed.has(k));
  if (move) PL.face = move;
  const tx = Math.floor((PL.x + 6) / TS), my = Math.floor((PL.y + 8) / TS), inW = tileCh(tx, my) === 'W', onL = !inW && tileCh(tx, my) === 'H';
  const wasW = PL.swim, wasC = PL.climb;
  PL.climb = onL && (PL.climb || up || down); if (PL.climb && PL.ground && !up) PL.climb = false;
  if (PL.climb) { PL.vy = up ? -64 : down ? 64 : 0; const cxp = tx * TS + 2; PL.vx = move ? move * 40 : Math.sign(cxp - PL.x) * Math.min(Math.abs(cxp - PL.x) / dt, 40); PL.climbD += Math.abs(PL.vy) * dt; }
  else if (inW) { PL.vy = up ? -60 : PL.ground ? 0 : down ? 110 : Math.min(90, PL.vy + 160 * dt); PL.vx = move * (PL.ground ? 56 : 60); }
  else { PL.coyote = PL.ground ? 0.08 : Math.max(0, PL.coyote - dt); PL.buffer = jumpP ? 0.1 : Math.max(0, PL.buffer - dt); PL.vx = move * 72; if (PL.coyote > 0 && PL.buffer > 0) { PL.vy = -300; PL.coyote = PL.buffer = 0; } if (PL.vy < 0 && !up && PL.held) PL.vy *= 0.5; PL.vy = Math.min(450, PL.vy + 700 * (PL.vy > 0 ? 1.6 : 1) * dt); }
  PL.held = up;
  PL.swim = inW;
  if (wasW && !inW && PL.vy < 0) PL.vy = Math.min(PL.vy, -225);
  if (wasC && !onL && PL.vy < 0) PL.vy = Math.min(PL.vy, -225);
  PL.x += PL.vx * dt; collideX(); PL.y += PL.vy * dt; collideY();
  PL.phase = PL.ground && PL.vx !== 0 ? Math.sin(PL.t * 8) : 0;
  if (pressed.has('e') && Math.abs(PL.x + 6 - (SHED.door.col * TS + 8)) < 14 && Math.floor((PL.y + 8) / TS) === SHED.door.row - 1) toast('go out: back to the Kitchen Garden');
  pressed.clear();
}
function figurePose() {
  const walking = PL.ground && PL.vx !== 0, s = Math.round(PL.phase), sf = Math.round(PL.phase * 3);
  const c = {airborne: !PL.ground && !PL.climb && !PL.swim, swimming: PL.swim && !PL.ground, climbing: PL.climb, climbPhase: Math.floor(PL.climbD / 7) & 1, stepOffset: s, bodyBob: walking ? -Math.abs(s) : 0, swimPhase: Math.sin(PL.t * 5)};
  const h = {...H.poseFromClassic(c), step: sf, bob: walking ? -Math.abs(sf) : 0, front: Math.round(3 * (3 + c.swimPhase * 2)), back: Math.round(3 * (3 - c.swimPhase * 2))};
  return {c, h};
}

// ---------------------------------------------------------------- creatures
const CR = critters.map(c => ({...c, x: c.col * TS + 8, y: c.row * TS, face: 1, t: c.col * 0.37, timer: 1, mode: 0}));
function critterFrame(c, dt) {
  c.t += dt;
  if (c.kind === 'mouse') { c.timer -= dt; if (c.timer <= 0) { c.mode ^= 1; c.timer = c.mode ? 0.35 : 1.5; if (c.mode && Math.random() < .5) c.face *= -1; } if (c.mode) c.x += c.face * 48 * dt; }
  if (c.kind === 'bookworm' || c.kind === 'worm') { if ((Math.floor(c.t * 2) & 1) === 0) c.x += c.face * (c.kind === 'worm' ? 4 : 5) * dt; }
  if (c.kind === 'mole') { c.timer -= dt; if (c.timer <= 0) { c.mode ^= 1; c.timer = c.mode ? 2.2 : 1.4; if (Math.random() < .4) c.face *= -1; } if (c.mode) c.x += c.face * 9 * dt; }
  if (c.min != null) { const a = c.min * TS, b = c.max * TS; if (c.x < a || c.x > b) { c.x = Math.max(a, Math.min(b, c.x)); c.face *= -1; } }
}
function critterArt(c) {
  switch (c.kind) {
    case 'cat': { const p = {stretching: c.t % 9 < 1.4, flick: c.t % 2.3 < .25 ? 1 : 0}; return {fn: C.cat, a: p, k: 'cat' + JSON.stringify(p), x: c.x, y: c.y, m: false}; }
    case 'mouse': { const w = c.mode ? 0 : Math.floor(c.t * 8) & 1; return {fn: C.mouse, a: w, k: 'mouse' + w, x: c.x, y: c.y, m: c.face < 0}; }
    case 'bookworm': { const f = Math.floor(c.t * 2) & 1; return {fn: C.bookworm, a: f, k: 'bw' + f, x: c.x, y: c.y, m: c.face < 0}; }
    case 'worm': { const f = Math.floor(c.t * 2) & 1; return {fn: C.worm, a: f, k: 'worm' + f, x: c.x, y: c.y, m: c.face < 0}; }
    case 'mole': { const f = c.mode ? Math.floor(c.t * 4) & 1 : 0; return {fn: C.mole, a: f, k: 'mole' + f, x: c.x, y: c.y, m: c.face < 0}; }
    case 'moth': { const an = c.t * 1.6, f = Math.floor(c.t * 10) & 1; return {fn: C.moth, a: f, k: 'moth' + f, x: c.x + Math.cos(an) * c.rx * TS, y: c.y + Math.sin(an) * c.ry * TS + Math.sin(c.t * 5.3) * 2, m: Math.sin(an) > 0}; }
    case 'spider': { const f = Math.floor(c.t * 2.5) & 1, len = c.len * TS * (0.8 + 0.2 * Math.sin(c.t * 0.9)); return {fn: C.spider, a: f, k: 'sp' + f, x: c.x, y: c.y + len, m: false, thread: [c.x, c.y]}; }
  }
}

// ---------------------------------------------------------------- camera, rooms, fog
let cam = {x: 0, y: 0}, visited = new Set([SHED.rooms.findIndex(r => r.id === 'shed')]), reveal = new Map();
const roomOf = () => { const r = roomAt[Math.floor((PL.y + 8) / TS)]?.[Math.floor((PL.x + 6) / TS)]; return r == null ? -1 : r; };
function toast(s) { st.toast = {s, t: 2.4}; }
function updateCam(dt) {
  const ri = roomOf(), r = rooms[ri];
  if (ri >= 0 && !visited.has(ri)) { visited.add(ri); reveal.set(ri, 0); toast(r.name); }
  for (const [k, v] of reveal) { if (v >= 1) reveal.delete(k); else reveal.set(k, v + dt / 0.7); }
  let tx = PL.x + 6 - 160, ty = PL.y + 8 - 112;
  if (r && r.id === 'shed') { tx = (r.x0 + r.x1 + 1) / 2 * TS - 160; ty = (r.y0 + r.y1 + 1) / 2 * TS - 112; }
  tx = Math.max(0, Math.min(W * TS - 320, tx)); ty = Math.max(0, Math.min(MH * TS - 224, ty));
  const f = 1 - Math.exp(-(r && r.id === 'shed' ? 14 : 6) * dt); cam.x += (tx - cam.x) * f; cam.y += (ty - cam.y) * f;
}
const FOG = [0, .25, .5, .75, 1].map(d => { const [c, x] = mk(4, 4); x.fillStyle = '#000'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (bayer(i, j) < d) x.fillRect(i, j, 1, 1); return sctx.createPattern(c, 'repeat'); });
function drawFog(ctx, sx, sy) {
  if (!st.fog) return;
  const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
  for (let ty = y0; ty <= y0 + 15; ty++) for (let tx = x0; tx <= x0 + 21; tx++) { const ri = (roomAt[ty] || [])[tx]; if (ri == null || ri < 0 || (visited.has(ri) && !reveal.has(ri))) continue; const d = visited.has(ri) ? 1 - Math.min(1, reveal.get(ri)) : 1; const lvl = Math.round(d * 4); if (!lvl) continue; ctx.fillStyle = FOG[lvl]; ctx.fillRect(tx * 48 - sx, ty * 48 - sy, 48, 48); }
}

// ---------------------------------------------------------------- page 1: play
function renderPlay(ctx, hd) {
  const sx = Math.round(cam.x * 3), sy = Math.round(cam.y * 3), m = hd ? 'h' : 'c';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
  for (let cy = Math.floor(sy / SH); cy <= Math.floor((sy + SH - 1) / SH); cy++) for (let cx = Math.floor(sx / SW); cx <= Math.floor((sx + SW - 1) / SW); cx++) if (cx >= 0 && cy >= 0 && cx * CW < W && cy * CHH < MH) ctx.drawImage(chunk(m, cx, cy), cx * SW - sx, cy * SH - sy);
  for (const c of CR) { const a = critterArt(c); if (!a) continue; const X = Math.round(a.x * 3) - sx, Y = Math.round(a.y * 3) - sy; if (X < -80 || X > SW + 80 || Y < -80 || Y > SH + 80) continue;
    if (a.thread) { ctx.fillStyle = css(D.heather); ctx.fillRect(Math.round(a.thread[0] * 3) - sx + (hd ? 1 : 0), Math.round(a.thread[1] * 3) - sy, hd ? 1 : 3, Y - (Math.round(a.thread[1] * 3) - sy)); }
    if (hd) { const L = lightAt(a.x * 3, a.y * 3 - 6, amb, lights), steps = Math.max(0, Math.min(3, Math.round((0.62 - L) / 0.16))); M('cr' + a.k + 'L' + steps, () => litCopy(hdOf(a.fn, a.a), steps)).blit(ctx, X, Y, a.m); }
    else cg(a.fn, a.a).draw(ctx, X, Y, 3, a.m); }
  const {c, h} = figurePose(), X = Math.round((PL.x + 6) * 3) - sx, Y = Math.round((PL.y + 16) * 3) - sy;
  if (hd) M('fig' + JSON.stringify(h), () => H.figure(h)).blit(ctx, X, Y, PL.face < 0); else cg(C.figure, c).draw(ctx, X, Y, 3, PL.face < 0);
  drawFog(ctx, sx, sy);
}
function chromePlay() {
  const r = rooms[roomOf()];
  if (st.toast) { st.toast.t -= 1 / 60; const s = st.toast.s, w = measure(s, 2) + 24; fill(sctx, D.valhalla, 16, 16, w, 34); fill(sctx, D.oiledCedar, 16, 48, w, 2); textCtx(sctx, s, 28, 24, D.pancho, 2); if (st.toast.t <= 0) st.toast = null; }
  else if (r) textCtx(sctx, r.name, 20, 20, D.heather, 2);
}

// ---------------------------------------------------------------- page 2: cutaway map
const MT = 7, MX = 8, MY = 40;
const KIND_COL = {shed: D.loulou, drawers: D.oiledCedar, kitchen: D.rope, wallGreen: D.dell, wallRose: D.smokeyAsh, rafters: D.loulou, brick: D.oiledCedar, earth: D.valhalla, cave: D.deepKoamaru};
const TILE_COL = {j: D.opal, f: D.twine, T: D.rope, L: D.clairvoyant, e: D.black, r: D.stinger, K: D.topaz, W: D.venice};
const MAPCV = (() => {
  const [cv, x] = mk(SW, SH); x.fillStyle = '#0a0a12'; x.fillRect(0, 0, SW, SH);
  for (let y = 0; y < MH; y++) for (let tx = 0; tx < W; tx++) { const ch = MAP[y][tx], ri = bdRoom[y][tx]; let c = ri >= 0 ? KIND_COL[rooms[ri].kind] : passable(tx, y) ? D.loulou : TILE_COL[ch] ?? D.opal; x.fillStyle = css(c); x.fillRect(MX + tx * MT, MY + y * MT, MT - 1, MT - 1); if (ch === 'H') { x.fillStyle = css(D.pancho); x.fillRect(MX + tx * MT + 1, MY + y * MT, 1, MT); x.fillRect(MX + tx * MT + 4, MY + y * MT, 1, MT); x.fillRect(MX + tx * MT + 1, MY + y * MT + 3, 4, 1); } }
  for (const [tx, ty] of R.lost) { x.fillStyle = css(D.clairvoyant); x.fillRect(MX + tx * MT, MY + ty * MT, MT - 1, MT - 1); }
  x.fillStyle = css(D.white); x.fillRect(MX + SHED.door.col * MT + 1, MY + (SHED.door.row - 2) * MT, MT - 2, MT * 2 - 1);
  for (const s of lights) { x.fillStyle = css(s.warm ? D.goldenFizz : D.lightSteel); x.fillRect(MX + Math.floor(s.x * MT) - 1, MY + Math.floor(s.y * MT) - 1, 3, 3); }
  return cv;
})();
const CR_LET = {cat: 'c', mouse: 'm', bookworm: 'b', moth: 't', spider: 's', mole: 'o', worm: 'w'};
function renderMap(ctx) { ctx.drawImage(MAPCV, 0, 0); }
function chromeMap() {
  textCtx(sctx, 'THE POTTING SHED, INSIDE   120 x 88 tiles   1 square = 1 tile', MX, 12, D.pancho, 2);
  for (const r of rooms) { if (r.x1 - r.x0 < 4) continue; const s = r.name, w = measure(s, 1); const x = MX + Math.round((r.x0 + r.x1 + 1) / 2 * MT - w / 2), y = MY + r.y0 * MT + 3; textCtx(sctx, s, x + 1, y + 1, D.black, 1); textCtx(sctx, s, x, y, D.white, 1); }
  landmarks.forEach((l, i) => { const x = MX + l.col * MT, y = MY + (l.row - 2) * MT; fill(sctx, D.goldenFizz, x - 1, y - 1, 9, 9); textCtx(sctx, String(i + 1), x + 1, y, D.valhalla, 1); });
  for (const c of critters) textCtx(sctx, CR_LET[c.kind], MX + c.col * MT, MY + (c.row - 1) * MT, D.mandy, 1);
  const lx = 856; let ly = 44;
  const key = (c, s) => { fill(sctx, c, lx, ly, 10, 10); textCtx(sctx, s, lx + 16, ly + 1, D.heather, 1); ly += 16; };
  textCtx(sctx, 'ROOMS', lx, ly, D.pancho, 1); ly += 14;
  for (const [k, s] of [['shed', 'boards'], ['drawers', 'drawers'], ['kitchen', 'plaster'], ['wallGreen', 'green paper'], ['wallRose', 'rose paper'], ['brick', 'cellar brick'], ['earth', 'earth'], ['cave', 'wet rock']]) key(KIND_COL[k], s);
  ly += 6; textCtx(sctx, 'TILES', lx, ly, D.pancho, 1); ly += 14;
  for (const [k, s] of [['j', 'j plank wall'], ['f', 'f floorboards'], ['T', 'T timber'], ['L', 'L bookcase'], ['K', 'K dark stone'], ['e', 'e earth'], ['W', 'W water']]) key(TILE_COL[k], s);
  key(D.pancho, 'H ladder');
  ly += 6; key(D.white, 'door (E)'); key(D.goldenFizz, 'warm light'); key(D.lightSteel, 'window light');
  ly += 6; textCtx(sctx, 'LANDMARKS', lx, ly, D.pancho, 1); ly += 14; landmarks.forEach((l, i) => { textCtx(sctx, (i + 1) + ' ' + l.name, lx, ly, D.heather, 1); ly += 12; });
  ly += 6; textCtx(sctx, 'CREATURES', lx, ly, D.pancho, 1); ly += 14; for (const [k, v] of Object.entries(CR_LET)) { textCtx(sctx, v + ' ' + k, lx, ly, D.mandy, 1); ly += 12; }
  const ok = R.lost.length === 0; textCtx(sctx, ok ? 'reach: all ' + R.total + ' standing cells, both ways' : 'reach: ' + R.lost.length + ' cells cut off (red)', MX, 660 - 8, ok ? D.atlantis : D.clairvoyant, 1);
  textCtx(sctx, 'click anywhere to go there', 600, 652, D.heather, 1);
}

// ---------------------------------------------------------------- pages 3-5: sheets
const fill = (ctx, c, x, y, w, h) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, w, h); };
let chrome = [];
const label = (s, x, y, c = D.pancho, dot = 1) => chrome.push([s, x, y, c, dot]);
function zoomed(ctx, hd, art, x, y, z, mirror) { if (!hd) return art.g.draw(ctx, x, y, 3 * z, mirror); const S = art.h, cv = S.canvas(); ctx.drawImage(cv, x + S.x0 * z, y + S.y0 * z, S.w * z, S.h * z); }
const FNID = new Map(); const fid = fn => { if (!FNID.has(fn)) FNID.set(fn, FNID.size); return FNID.get(fn); };
const art = (fn, ...a) => ({g: cg(fn, ...a), h: M('A' + fid(fn) + JSON.stringify(a), () => hdOf(fn, ...a))});
const PROP_LIST = [['pottingBench', 'potting bench'], ['pots', 'pots'], ['rake', 'rake'], ['shedDoor', 'shed door'], ['shedWindow', 'shed window'], ['stove', 'stove'], ['kitchenTable', 'table'], ['drawerCabinet', 'drawers'],
  ['trunk', 'trunk'], ['sheetedTrunk', 'dust sheet'], ['rockingHorse', 'rocking horse'], ['bed', 'bed'], ['desk', 'desk + lamp'], ['dressForm', 'dress form'], ['appleCrate', 'apple crate'], ['jars', 'jars'],
  ['boiler', 'boiler'], ['candle', 'candle'], ['smallWindow', 'window'], ['skylight', 'skylight'], ['lampHang', 'lamp', 1], ['herbs', 'herbs', 1], ['lavender', 'lavender', 1], ['onions', 'onions', 1], ['pipes', 'pipes', 1], ['roots', 'roots', 1]];
function renderProps(ctx, hd) {
  fill(ctx, D.valhalla, 0, 0, SW, SH);
  PROP_LIST.forEach(([n, , hang], i) => { const col = i % 7, row = Math.floor(i / 7), x = 70 + col * 136, y = row * 160 + (hang ? 40 : 150); fill(ctx, D.loulou, col * 136 + 4, row * 160 + 30, 128, 126); zoomed(ctx, hd, art(P[n]), x, y, n === 'stove' || n === 'boiler' || n === 'drawerCabinet' ? 1 : 2); });
}
function chromeProps() { PROP_LIST.forEach(([, s], i) => label(s, (i % 7) * 136 + 8, Math.floor(i / 7) * 160 + 16)); label('PROPS  x2 (stove, boiler, drawers x1)  -  hanging ones anchor at the ceiling', 8, 650, D.heather); }
const CR_LIST = [['cat', C.cat, [{stretching: false, flick: 0}, {stretching: false, flick: 1}, {stretching: true, flick: 0}]], ['mouse', C.mouse, [0, 1]], ['bookworm', C.bookworm, [0, 1]], ['moth', C.moth, [0, 1]], ['spider', C.spider, [0, 1]], ['mole', C.mole, [0, 1]], ['earthworm', C.worm, [0, 1]]];
const NEW_FP = {spider: [0, 1].map(f => footprint(cg(C.spider, f), hdOf(C.spider, f))), mole: [0, 1].map(f => footprint(cg(C.mole, f), hdOf(C.mole, f))), earthworm: [0, 1].map(f => footprint(cg(C.worm, f), hdOf(C.worm, f)))};
const LM_LIST = landmarks.map(l => [l.name, P[l.body]]);
function renderCreatures(ctx, hd) {
  fill(ctx, D.valhalla, 0, 0, SW, SH);
  CR_LIST.forEach(([n, fn, frames], i) => { const y = 40 + i * 74; frames.forEach((a, k) => { fill(ctx, D.loulou, 110 + k * 96, y, 90, 64); zoomed(ctx, hd, art(fn, a), 155 + k * 96, y + (fn === C.spider ? 14 : 52), 2); }); });
  [[C.spiderLarge, 560], [C.moleLarge, 700], [C.wormLarge, 850]].forEach(([fn, x]) => { fill(ctx, D.pancho, x - 66, 40, 132, 128); zoomed(ctx, hd, art(fn), x, 150, 1); });
  landmarks.forEach((l, i) => { const x = 470 + (i % 3) * 160, y = i < 3 ? 400 : 620; fill(ctx, D.loulou, x - 76, y - 196, 152, 200); zoomed(ctx, hd, art(P[l.body]), x, y - 8, 1); });
}
function chromeCreatures() {
  CR_LIST.forEach(([n], i) => { label(n, 8, 50 + i * 74); const fp = NEW_FP[n]; if (fp) label(fp.every(v => !v) ? 'fp ok' : 'fp ' + fp.join('/'), 8, 64 + i * 74, D.atlantis); });
  label('CREATURES x2  (new: spider, mole, earthworm)', 110, 18, D.heather); label('PORTRAITS (page size)', 494, 18, D.heather); label('LANDMARKS at play size', 394, 186, D.heather);
  landmarks.forEach((l, i) => label(l.name, 470 + (i % 3) * 160 - 72, (i < 3 ? 400 : 620) - 190, D.pancho));
}
const TL = [['f', 'f floorboards'], ['j', 'j plank wall'], ['e', 'e packed earth'], ['r', 'r root earth'], ['K', 'K dark stone'], ['T', 'T timber'], ['L', 'L bookcase']];
const BD_LIST = ['shed', 'drawers', 'kitchen', 'wallGreen', 'wallRose', 'rafters', 'brick', 'earth', 'cave'];
function tileBlock(hd, ch) { return M((hd ? 'h' : 'c') + 'blk' + ch, () => {
  const ty0 = 60, nb = (j) => ({up: ch === 'f' ? j === 0 : j === 0, down: ch === 'f' ? j === 1 : ch === 'r' ? j === 1 : false, depth: 0});
  if (hd) { const S = new F(0, 0, 96, 120); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) H.shedTile(S, ch, i * 48, j * 48, 3 + i, ty0 + j, nb(j)); return S.canvas(); }
  const [cv, x] = mk(96, 120); const g = new G(); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) C.shedTile(g, ch, i * 16, j * 16, 3 + i, ty0 + j, nb(j)); g.draw(x, 0, 0, 3); return cv; }); }
function renderTiles(ctx, hd) {
  fill(ctx, D.black, 0, 0, SW, SH);
  TL.forEach(([ch], i) => { const x = 16 + i * 134; fill(ctx, D.valhalla, x, 30, 96, 150); ctx.drawImage(tileBlock(hd, ch), x, 30); });
  BD_LIST.forEach((k, i) => { const x = 16 + i * 104; if (hd) ctx.drawImage(M('bd' + k, () => { const r = {x0: 0, y0: 4, x1: 1, y1: 5}; const S = new F(0, 192, 96, 96); for (let j = 0; j < 96; j++) for (let q = 0; q < 96; q++) S.set(q, 192 + j, BD[k](q, 192 + j, r)); return S.canvas(); }), x, 220); else fill(ctx, D.valhalla, x, 220, 96, 96); });
  // light ramp
  const r = {x0: 0, y0: 0, x1: 19, y1: 30};
  if (hd) ctx.drawImage(M('ramp', () => { const S = new F(0, 0, 928, 120); for (let j = 0; j < 120; j++) for (let q = 0; q < 928; q++) { const L = 1 - q / 928, c = j < 60 ? BD.wallRose(q, j + 400, r) : BD.earth(q, j + 400, {y0: 0}); S.set(q, j, lit(c, L, q, j)); } return S.canvas(); }), 16, 370);
  else fill(ctx, D.valhalla, 16, 370, 928, 120);
  if (hd) ctx.drawImage(M('pool', () => { const S = new F(0, 0, 928, 130), ls = [{x: 4, y: 1.6, r: 6, warm: true, str: .6}, {x: 14, y: 1.2, r: 5, warm: false, str: .4}]; for (let j = 0; j < 130; j++) for (let q = 0; q < 928; q++) { let c = BD.drawers(q, j); let L = 0.3; for (const s of ls) { const d = Math.hypot(q / 48 - s.x, j / 48 - s.y); if (d < s.r) L += s.str * Math.pow(1 - d / s.r, 1.5); } c = lit(c, L, q, j); const d = Math.hypot(q / 48 - 4, j / 48 - 1.6) / 6; if (d < .6 && bayer(q * 7 + 3, j * 5 + 1) < .1 * Math.pow(1 - d / .6, 2) && tileHash(q >> 1, j >> 1, 950) < .5) c = d < .25 ? D.goldenFizz : D.tahitiGold; S.set(q, j, c); } hdProp('lampHang').forInk((x, y, c) => S.set(192 + x, 20 + y, c)); hdProp('smallWindow').forInk((x, y, c) => S.set(672 + x, 92 + y, c)); return S.canvas(); }), 16, 520);
  else fill(ctx, D.valhalla, 16, 520, 928, 130);
}
function chromeTiles() {
  TL.forEach(([, s], i) => label(s, 16 + i * 134, 14)); label('NEW TILES  2x2, play size', 16, 186, D.heather);
  BD_LIST.forEach((k, i) => label(k, 16 + i * 104, 322)); label('BACKDROPS (not tiles: room regions, like backdropRegions)', 16, 204, D.heather);
  label('LIGHT RAMP  L = 1 ... 0   each step = one ramp tone down, Bayer between steps', 16, 354, D.heather);
  [1, .86, .62, .46, .3, .14, 0].forEach(L => label('L ' + L, 16 + Math.round((1 - L) * 928), 494, D.pancho));
  label('POOLS  warm lamp (glow pixels on the backdrop only)  /  cool window (light only)', 16, 506, D.heather);
}

// ---------------------------------------------------------------- page 6: sketchbook
const PAGES6 = landmarks.map(l => ({name: l.name, text: l.text, fn: P[l.sketch], ay: 426})).concat(['spider', 'mole', 'worm'].map(k => ({name: CRITTER_TEXT[k].name, text: CRITTER_TEXT[k].text, fn: C[k + 'Large'], ay: 470})));
const FX = 120, FY = 96, FW = 720, FH = 480;
function pageHD(p) { return M('pg' + p.name, () => {
  const S = new F(0, 0, 960, 672); S.rect(0, 0, 960, 672, D.black).dither(0, 0, 960, 672, null, D.valhalla, .5);
  S.rect(FX, FY, FW, FH, D.pancho).dither(FX, FY, FW, FH, null, D.twine, (px, py) => { const ex = Math.min(px - FX, FX + FW - 1 - px), ey = Math.min(py - FY, FY + FH - 1 - py); return Math.min(.6, .45 * (Math.pow(Math.max(0, 1 - ex / 40), 1.6) + Math.pow(Math.max(0, 1 - ey / 40), 1.6))); });
  const ring = (i, top, bot) => { const x = FX - 3 + i, y = FY - 3 + i, w = FW + 6 - 2 * i, h = FH + 6 - 2 * i; S.rect(x, y, w, 1, top).rect(x, y, 1, h, top).rect(x, y + h - 1, w, 1, bot).rect(x + w - 1, y, 1, h, bot); };
  ring(0, D.loulou, D.loulou); ring(1, D.oiledCedar, D.oiledCedar); ring(2, D.oiledCedar, D.oiledCedar); ring(3, D.oiledCedar, D.oiledCedar); ring(4, D.rope, D.loulou);
  textF(S, p.name, FX + 36, FY + 30, D.valhalla, 3); S.rect(FX + 36, FY + 96, FW - 72, 2, D.oiledCedar).rect(FX + 36, FY + 98, FW - 72, 1, D.twine);
  hdOf(p.fn).forInk((x, y, c) => S.set(276 + x, p.ay + y, c));
  wrap(p.text, 30).forEach((l, i) => textF(S, l, 450, 234 + i * 30, D.valhalla, 2));
  const hint = '[ <- -> turn page    E close ]'; textF(S, hint, FX + Math.round((FW - measure(hint, 2)) / 2), 528, D.dimGray, 2);
  return S.canvas(); }); }
function pageClassic(p) { return M('pgc' + p.name, () => { const [cv, x] = mk(960, 672); x.globalAlpha = .7; fill(x, D.valhalla, 0, 0, 960, 672); x.globalAlpha = 1; fill(x, D.pancho, FX, FY, FW, FH); x.fillStyle = css(D.oiledCedar); x.fillRect(FX - 3, FY - 3, FW + 6, 6); x.fillRect(FX - 3, FY + FH - 3, FW + 6, 6); x.fillRect(FX - 3, FY - 3, 6, FH + 6); x.fillRect(FX + FW - 3, FY - 3, 6, FH + 6); x.fillStyle = css(D.valhalla); x.textBaseline = 'top'; x.font = 'bold 42px monospace'; x.fillText(p.name, FX + 36, FY + 30); fill(x, D.oiledCedar, FX + 36, FY + 96, FW - 72, 3); cg(p.fn).draw(x, 276, p.ay, 3); x.fillStyle = css(D.valhalla); x.font = '27px monospace'; let line = '', yy = 234; for (const w of p.text.split(' ')) { if (x.measureText(line + ' ' + w).width > 390 && line) { x.fillText(line, 450, yy); yy += 39; line = w; } else line = line ? line + ' ' + w : w; } x.fillText(line, 450, yy); return cv; }); }
function renderSketch(ctx, hd) { const p = PAGES6[st.sketch]; ctx.drawImage(hd ? pageHD(p) : pageClassic(p), 0, 0); }
function chromeSketch() { textCtx(sctx, (st.sketch + 1) + ' / ' + PAGES6.length, FX + FW - 80, FY + 40, D.dimGray, 2); }

// ---------------------------------------------------------------- frame + input
const PAGES = {1: [renderPlay, chromePlay], 2: [renderMap, chromeMap], 3: [renderProps, chromeProps], 4: [renderCreatures, chromeCreatures], 5: [renderTiles, chromeTiles], 6: [renderSketch, chromeSketch]};
const MOVE = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '];
addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (MOVE.includes(k)) e.preventDefault(); if (e.repeat) return; keys.add(k); pressed.add(k);
  if (k === 'c') st.mode = st.mode === 'classic' ? 'hd' : 'classic'; if (k === 'v') st.mode = st.mode === 'split' ? 'hd' : 'split'; if (k === 'f') st.fog = !st.fog;
  if ('123456'.includes(k)) st.page = +k; if (st.page === 6 && (k === 'arrowright' || k === 'arrowleft')) st.sketch = (st.sketch + (k === 'arrowright' ? 1 : PAGES6.length - 1)) % PAGES6.length; syncUI(); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
stage.addEventListener('click', e => { if (st.page !== 2) return; const b = stage.getBoundingClientRect(), x = Math.floor(((e.clientX - b.left) * SW / b.width - MX) / MT), y = Math.floor(((e.clientY - b.top) * SH / b.height - MY) / MT); for (let dy = 0; dy < 12; dy++) if (R.stand(x, y + dy) && roomAt[y + dy]?.[x] >= 0) { spawnAt(x, y + dy); cam.x = PL.x - 160; cam.y = PL.y - 112; st.page = 1; syncUI(); return; } });
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; st.t += dt;
  if (st.page === 1) { acc += dt; while (acc >= 1 / 60) { physics(1 / 60); for (const c of CR) critterFrame(c, 1 / 60); acc -= 1 / 60; } updateCam(dt); }
  const [render, chromeFn] = PAGES[st.page]; chrome = [];
  const need = st.mode === 'split' ? ['c', 'h'] : [st.mode === 'classic' ? 'c' : 'h'];
  if (need.includes('c')) render(ctxA, false); if (need.includes('h')) render(ctxB, true);
  if (st.mode === 'split') { sctx.drawImage(bufA, 0, 0, 480, SH, 0, 0, 480, SH); sctx.drawImage(bufB, 480, 0, 480, SH, 480, 0, 480, SH); fill(sctx, D.white, 479, 0, 2, SH); } else sctx.drawImage(st.mode === 'classic' ? bufA : bufB, 0, 0);
  chromeFn(); for (const [s, x, y, c, dot] of chrome) textCtx(sctx, s, x, y, c, dot);
  const tag = (s, x) => { const w = measure(s, 2) + 16, x0 = x > 480 ? x - w : x; fill(sctx, D.valhalla, x0, SH - 34, w, 28); textCtx(sctx, s, x0 + 8, SH - 28, D.pancho, 2); };
  if (st.page !== 2) { if (st.mode === 'split') { tag('CLASSIC', 8); tag('HD', 952); } else tag(st.mode === 'classic' ? 'CLASSIC' : 'HD', 952); }
  requestAnimationFrame(frame);
}
function syncUI() { document.querySelectorAll('[data-page]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.page === st.page)); document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode)); document.getElementById('fog').setAttribute('aria-pressed', st.fog); }
document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { st.page = +b.dataset.page; syncUI(); b.blur(); });
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; syncUI(); b.blur(); });
document.getElementById('fog').onclick = e => { st.fog = !st.fog; syncUI(); e.target.blur(); };
document.querySelectorAll('[data-spawn]').forEach(b => b.onclick = () => { const s = SHED.spawns.find(s => s.id === b.dataset.spawn); spawnAt(s.col, s.row); cam.x = PL.x - 160; cam.y = PL.y - 112; st.page = 1; syncUI(); b.blur(); });
const qp = new URLSearchParams(location.search); if (qp.get('page')) st.page = +qp.get('page'); if (qp.get('mode')) st.mode = qp.get('mode');
cam.x = Math.max(0, (6 + 13) / 2 * TS - 160); cam.y = (44 + 50) / 2 * TS - 112;
syncUI(); requestAnimationFrame(frame);
