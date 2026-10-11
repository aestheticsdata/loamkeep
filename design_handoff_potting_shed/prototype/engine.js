'use strict';
// ---- Palette -------------------------------------------------------------
const DB32 = {black:0x000000,valhalla:0x222034,loulou:0x45283c,oiledCedar:0x663931,rope:0x8f563b,tahitiGold:0xdf7126,twine:0xd9a066,pancho:0xeec39a,goldenFizz:0xfbf236,atlantis:0x99e550,christi:0x6abe30,eltGreen:0x37946e,dell:0x4b692f,verdigris:0x595652,opal:0x323c39,deepKoamaru:0x3f3f74,venice:0x306082,royalBlue:0x5b6ee1,cornflower:0x639bff,viking:0x5fcde4,lightSteel:0xcbdbfc,white:0xffffff,heather:0x9badb7,topaz:0x847e87,dimGray:0x696a6a,smokeyAsh:0x76428a,clairvoyant:0xac3232,brown:0xd95763,mandy:0xd77bba,plum:0x8f974a,rainforest:0x8a6f30,stinger:0x524b24};
const D = DB32;
// Tones the game already ships outside DB32. Kept as-is, never extended.
const SHIPPED = {sky:0x88b6e8,cryptWall:0x202020,cryptFloor:0x303030,cryptHi:0xcfcfcf,cryptLo:0x000000,nightFar:0x18162a,nightNear:0x0e0d16,grotto:0x1a2030};
// Ramp: every tone knows its lit neighbour and its shadow neighbour, both DB32.
const RAMP = new Map([
  [D.white,[D.white,D.lightSteel]],[D.lightSteel,[D.white,D.heather]],[D.heather,[D.lightSteel,D.topaz]],
  [D.topaz,[D.heather,D.dimGray]],[D.dimGray,[D.topaz,D.verdigris]],[D.verdigris,[D.dimGray,D.opal]],
  [D.opal,[D.verdigris,D.valhalla]],[D.valhalla,[D.deepKoamaru,D.black]],
  [D.pancho,[D.white,D.twine]],[D.twine,[D.pancho,D.rope]],[D.rope,[D.twine,D.oiledCedar]],
  [D.oiledCedar,[D.rope,D.loulou]],[D.loulou,[D.oiledCedar,D.valhalla]],
  [D.atlantis,[D.atlantis,D.christi]],[D.christi,[D.atlantis,D.eltGreen]],[D.eltGreen,[D.christi,D.dell]],[D.dell,[D.eltGreen,D.opal]],
  [D.viking,[D.lightSteel,D.venice]],[D.venice,[D.cornflower,D.deepKoamaru]],[D.deepKoamaru,[D.royalBlue,D.valhalla]],
  [D.mandy,[D.pancho,D.smokeyAsh]],[D.clairvoyant,[D.brown,D.loulou]],[D.brown,[D.pancho,D.clairvoyant]],
]);
const hiOf = c => (RAMP.get(c) || [c, c])[0];
const loOf = c => (RAMP.get(c) || [c, c])[1];
const css = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
// Named blend, for the rare recipe that needs it. Never a free hex.
function mix(a, b, t) { const ch = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (ch(16) << 16) | (ch(8) << 8) | ch(0); }

const BAYER4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bayer = (x, y) => (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// Verbatim from tilemap.ts (same float semantics).
function tileHash(tx, ty, salt) {
  const n = (tx * 374761393 + ty * 668265263 + salt * 1274126177) | 0;
  return (((n ^ (n >>> 13)) * 1274126177) >>> 0) / 0xffffffff;
}

// ---- Fine-grid buffer: 1 cell = 1 fine px = 1/3 logical px -----------------
class F {
  constructor(x0, y0, w, h) { this.x0 = x0; this.y0 = y0; this.w = w; this.h = h; this.b = new Int32Array(w * h).fill(-1); this._c = null; }
  i(x, y) { x -= this.x0; y -= this.y0; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? -1 : y * this.w + x; }
  get(x, y) { const i = this.i(x, y); return i < 0 ? -1 : this.b[i]; }
  ink(x, y) { return this.get(x, y) !== -1; }
  set(x, y, c) { if (c == null) return this; const i = this.i(x, y); if (i >= 0) this.b[i] = c; return this; }
  clr(...pts) { for (let k = 0; k < pts.length; k += 2) { const i = this.i(pts[k], pts[k + 1]); if (i >= 0) this.b[i] = -1; } return this; }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) this.set(k, j, c); return this; }
  // density t of tone b over tone a (a == null keeps what is there)
  dither(x, y, w, h, a, b, t) { const fn = typeof t === 'function'; for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) { const v = bayer(k, j) < (fn ? t(k, j) : t) ? b : a; if (v != null) this.set(k, j, v); } return this; }
  vgrad(x, y, w, h, a, b, t0 = 0, t1 = 1) { return this.dither(x, y, w, h, a, b, (k, j) => t0 + (t1 - t0) * (j - y + 0.5) / h); }
  hgrad(x, y, w, h, a, b, t0 = 0, t1 = 1) { return this.dither(x, y, w, h, a, b, (k) => t0 + (t1 - t0) * (k - x + 0.5) / w); }
  disc(cx, cy, r, c) { for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let k = Math.floor(cx - r); k <= Math.ceil(cx + r); k++) { const dx = k + .5 - cx, dy = j + .5 - cy; if (dx * dx + dy * dy <= r * r) this.set(k, j, c); } return this; }
  ring(cx, cy, r, w, c) { for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let k = Math.floor(cx - r); k <= Math.ceil(cx + r); k++) { const dx = k + .5 - cx, dy = j + .5 - cy, d = dx * dx + dy * dy; if (d <= r * r && d > (r - w) * (r - w)) this.set(k, j, c); } return this; }
  line(x0, y0, x1, y1, c, th = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let s = 0; s <= n; s++) this.rect(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), th, th, c); return this; }
  forInk(fn) { for (let j = 0; j < this.h; j++) for (let k = 0; k < this.w; k++) { const c = this.b[j * this.w + k]; if (c !== -1) fn(k + this.x0, j + this.y0, c); } }
  _apply(list) { for (let k = 0; k < list.length; k += 3) { if (list[k + 2] === -1) this.clr(list[k], list[k + 1]); else this.set(list[k], list[k + 1], list[k + 2]); } return this; }
  // 1-fine outline on the inside of the silhouette
  outline(c) { const o = []; this.forInk((x, y) => { if (!this.ink(x - 1, y) || !this.ink(x + 1, y) || !this.ink(x, y - 1) || !this.ink(x, y + 1)) o.push(x, y, c); }); return this._apply(o); }
  // Light from upper-left: edges facing up/left take the ramp's hi, edges facing down/right its lo
  edges(skip = [], ramp = RAMP) { const o = []; this.forInk((x, y, c) => { if (skip.includes(c)) return; const r = ramp.get(c); if (!r) return; if (!this.ink(x, y + 1) || !this.ink(x + 1, y)) o.push(x, y, r[1]); else if (!this.ink(x, y - 1) || !this.ink(x - 1, y)) o.push(x, y, r[0]); }); return this._apply(o); }
  // Material boundary: a pixel of `a` touching `b` below/right becomes `c`
  seam(a, b, c) { const o = []; this.forInk((x, y, v) => { if (v === a && (this.get(x + 1, y) === b || this.get(x, y + 1) === b)) o.push(x, y, c); }); return this._apply(o); }
  // Remove convex corner pixels (1 fine px) — rounds a 3×3 staircase without changing the footprint
  round() { const o = []; this.forInk((x, y) => { const u = this.ink(x, y - 1), d = this.ink(x, y + 1), l = this.ink(x - 1, y), r = this.ink(x + 1, y); if ((!u && !l && d && r) || (!u && !r && d && l) || (!d && !l && u && r) || (!d && !r && u && l)) o.push(x, y, -1); }); return this._apply(o); }
  // Fill the inner elbow of a staircase step (adds 1 fine px into an empty logical px)
  elbows() { const o = []; for (let j = this.y0; j < this.y0 + this.h; j++) for (let k = this.x0; k < this.x0 + this.w; k++) { if (this.ink(k, j)) continue; const u = this.get(k, j - 1), d = this.get(k, j + 1), l = this.get(k - 1, j), r = this.get(k + 1, j); const p = (a, b) => a !== -1 && b !== -1; if (p(u, l) && !this.ink(k + 1, j) && !this.ink(k, j + 1)) o.push(k, j, l); else if (p(u, r) && !this.ink(k - 1, j) && !this.ink(k, j + 1)) o.push(k, j, r); else if (p(d, l) && !this.ink(k + 1, j) && !this.ink(k, j - 1)) o.push(k, j, l); else if (p(d, r) && !this.ink(k - 1, j) && !this.ink(k, j - 1)) o.push(k, j, r); } return this._apply(o); }
  swap(from, to) { for (let i = 0; i < this.b.length; i++) if (this.b[i] === from) this.b[i] = to; return this; }
  canvas() { if (this._c) return this._c; const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h; const ctx = cv.getContext('2d'); const im = ctx.createImageData(this.w, this.h); for (let i = 0; i < this.b.length; i++) { const c = this.b[i]; if (c === -1) continue; im.data[i * 4] = (c >> 16) & 255; im.data[i * 4 + 1] = (c >> 8) & 255; im.data[i * 4 + 2] = c & 255; im.data[i * 4 + 3] = 255; } ctx.putImageData(im, 0, 0); return (this._c = cv); }
  // Draw with the anchor at fine (ax, ay). mirror: fine x -> -x-1 (= Pixi scale.x = -1)
  blit(ctx, ax, ay, mirror = false) { const cv = this.canvas(); ax = Math.round(ax); ay = Math.round(ay); if (!mirror) ctx.drawImage(cv, ax + this.x0, ay + this.y0); else { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(cv, this.x0 - ax, ay + this.y0); ctx.restore(); } }
}

// ---- Classic recorder: the game's Graphics.rect().fill(), logical px ------
class G {
  constructor() { this.ops = []; this.m = null; }
  setTransform(a, b, c, d, e, f) { this.m = [a, d, e, f]; }
  resetTransform() { this.m = null; }
  rect(x, y, w, h) { const r = this.m ? {x: x * this.m[0] + this.m[2], y: y * this.m[1] + this.m[3], w: w * this.m[0], h: h * this.m[1]} : {x, y, w, h}; const g = this; return {fill(c) { const o = typeof c === 'number' ? {c, a: 1} : {c: c.color, a: c.alpha}; g.ops.push(Object.assign(r, o)); return g; }}; }
  clear() { this.ops = []; return this; }
  // anchor at screen (sx, sy), s screen px per logical px
  draw(ctx, sx, sy, s = 3, mirror = false) { sx = Math.round(sx); sy = Math.round(sy); for (const o of this.ops) { const x = mirror ? -(o.x + o.w) : o.x; ctx.globalAlpha = o.a; ctx.fillStyle = css(o.c); ctx.fillRect(sx + x * s, sy + o.y * s, o.w * s, o.h * s); } ctx.globalAlpha = 1; }
  toCanvas(x0, y0, w, h, s = 3) { const cv = document.createElement('canvas'); cv.width = w * s; cv.height = h * s; this.draw(cv.getContext('2d'), -x0 * s, -y0 * s, s); return cv; }
  mask() { const set = new Set(); for (const o of this.ops) if (o.a === 1) for (let j = o.y; j < o.y + o.h; j++) for (let k = o.x; k < o.x + o.w; k++) set.add(k + ',' + j); return set; }
}
function cg(fn, ...a) { const g = new G(); fn(g, ...a); return g; }

// Footprint law: HD downsampled ÷3 by majority (ink if >= 5 of 9 fine px) must equal the classic mask.
function footprint(g, layers) {
  const cm = g.mask(); const L = [].concat(layers);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const k of cm) { const [x, y] = k.split(',').map(Number); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (const f of L) { x0 = Math.min(x0, Math.floor(f.x0 / 3)); y0 = Math.min(y0, Math.floor(f.y0 / 3)); x1 = Math.max(x1, Math.ceil((f.x0 + f.w) / 3)); y1 = Math.max(y1, Math.ceil((f.y0 + f.h) / 3)); }
  let bad = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { let n = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (L.some(f => f.ink(x * 3 + i, y * 3 + j))) n++; if ((n >= 5) !== cm.has(x + ',' + y)) bad++; }
  return bad;
}

// ---- Fonts ----------------------------------------------------------------
const MENU = {
  A:['.XXX.','X...X','X...X','XXXXX','X...X','X...X','X...X'],B:['XXXX.','X...X','X...X','XXXX.','X...X','X...X','XXXX.'],C:['.XXXX','X....','X....','X....','X....','X....','.XXXX'],D:['XXXX.','X...X','X...X','X...X','X...X','X...X','XXXX.'],E:['XXXXX','X....','X....','XXXX.','X....','X....','XXXXX'],F:['XXXXX','X....','X....','XXXX.','X....','X....','X....'],G:['.XXXX','X....','X....','X.XXX','X...X','X...X','.XXXX'],H:['X...X','X...X','X...X','XXXXX','X...X','X...X','X...X'],I:['XXXXX','..X..','..X..','..X..','..X..','..X..','XXXXX'],J:['....X','....X','....X','....X','X...X','X...X','.XXX.'],K:['X...X','X..X.','X.X..','XX...','X.X..','X..X.','X...X'],L:['X....','X....','X....','X....','X....','X....','XXXXX'],M:['X...X','XX.XX','X.X.X','X.X.X','X...X','X...X','X...X'],N:['X...X','XX..X','X.X.X','X..XX','X...X','X...X','X...X'],O:['.XXX.','X...X','X...X','X...X','X...X','X...X','.XXX.'],P:['XXXX.','X...X','X...X','XXXX.','X....','X....','X....'],Q:['.XXX.','X...X','X...X','X...X','X.X.X','X..X.','.XX.X'],R:['XXXX.','X...X','X...X','XXXX.','X.X..','X..X.','X...X'],S:['.XXXX','X....','X....','.XXX.','....X','....X','XXXX.'],T:['XXXXX','..X..','..X..','..X..','..X..','..X..','..X..'],U:['X...X','X...X','X...X','X...X','X...X','X...X','.XXX.'],V:['X...X','X...X','X...X','X...X','X...X','.X.X.','..X..'],W:['X...X','X...X','X...X','X.X.X','X.X.X','X.X.X','.X.X.'],X:['X...X','X...X','.X.X.','..X..','.X.X.','X...X','X...X'],Y:['X...X','X...X','.X.X.','..X..','..X..','..X..','..X..'],Z:['XXXXX','....X','...X.','..X..','.X...','X....','XXXXX'],
  '0':['.XXX.','X...X','X..XX','X.X.X','XX..X','X...X','.XXX.'],'1':['..X..','.XX..','..X..','..X..','..X..','..X..','.XXX.'],'2':['.XXX.','X...X','....X','...X.','..X..','.X...','XXXXX'],'3':['XXXXX','...X.','..X..','...X.','....X','X...X','.XXX.'],'4':['...X.','..XX.','.X.X.','X..X.','XXXXX','...X.','...X.'],'5':['XXXXX','X....','XXXX.','....X','....X','X...X','.XXX.'],'6':['..XX.','.X...','X....','XXXX.','X...X','X...X','.XXX.'],'7':['XXXXX','....X','...X.','..X..','.X...','.X...','.X...'],'8':['.XXX.','X...X','X...X','.XXX.','X...X','X...X','.XXX.'],'9':['.XXX.','X...X','X...X','.XXXX','....X','...X.','.XX..'],
  '/':['....X','....X','...X.','..X..','.X...','X....','X....'],'(':['...X.','..X..','.X...','.X...','.X...','..X..','...X.'],')':['.X...','..X..','...X.','...X.','...X.','..X..','.X...'],' ':['.....','.....','.....','.....','.....','.....','.....'],
};
// "Loam Book": the in-game text face. Capitals are the menu's 5×7, so title and book
// share one alphabet; lowercase adds a 5-dot x-height and 2-dot descenders. 9 rows.
const BOOK = {};
for (const k in MENU) BOOK[k] = [...MENU[k], '.....', '.....'];
function lc(ch, start, rows) { const g = Array(9).fill('.....'); rows.forEach((r, i) => g[start + i] = r); BOOK[ch] = g; }
lc('a',2,['.XXX.','....X','.XXXX','X...X','.XXXX']);lc('b',0,['X....','X....','XXXX.','X...X','X...X','X...X','XXXX.']);lc('c',2,['.XXXX','X....','X....','X....','.XXXX']);lc('d',0,['....X','....X','.XXXX','X...X','X...X','X...X','.XXXX']);lc('e',2,['.XXX.','X...X','XXXXX','X....','.XXXX']);lc('f',0,['..XX.','.X...','XXXX.','.X...','.X...','.X...','.X...']);lc('g',2,['.XXXX','X...X','X...X','X...X','.XXXX','....X','XXXX.']);lc('h',0,['X....','X....','XXXX.','X...X','X...X','X...X','X...X']);lc('i',0,['..X..','.....','.XX..','..X..','..X..','..X..','.XXX.']);lc('j',0,['...X.','.....','..XX.','...X.','...X.','...X.','...X.','...X.','XXX..']);lc('k',0,['X....','X....','X..X.','X.X..','XX...','X.X..','X..X.']);lc('l',0,['.XX..','..X..','..X..','..X..','..X..','..X..','.XXX.']);lc('m',2,['XX.X.','X.X.X','X.X.X','X.X.X','X...X']);lc('n',2,['XXXX.','X...X','X...X','X...X','X...X']);lc('o',2,['.XXX.','X...X','X...X','X...X','.XXX.']);lc('p',2,['XXXX.','X...X','X...X','X...X','XXXX.','X....','X....']);lc('q',2,['.XXXX','X...X','X...X','X...X','.XXXX','....X','....X']);lc('r',2,['X.XX.','XX..X','X....','X....','X....']);lc('s',2,['.XXXX','X....','.XXX.','....X','XXXX.']);lc('t',0,['.X...','.X...','XXXX.','.X...','.X...','.X...','..XX.']);lc('u',2,['X...X','X...X','X...X','X...X','.XXXX']);lc('v',2,['X...X','X...X','X...X','.X.X.','..X..']);lc('w',2,['X...X','X...X','X.X.X','X.X.X','.X.X.']);lc('x',2,['X...X','.X.X.','..X..','.X.X.','X...X']);lc('y',2,['X...X','X...X','X...X','X...X','.XXXX','....X','.XXX.']);lc('z',2,['XXXXX','...X.','..X..','.X...','XXXXX']);
lc('.',6,['..X..']);lc(',',5,['..X..','..X..','.X...']);lc('!',0,['..X..','..X..','..X..','..X..','..X..','.....','..X..']);lc('?',0,['.XXX.','X...X','....X','...X.','..X..','.....','..X..']);lc("'",0,['..X..','..X..','.X...']);lc('-',3,['.XXX.']);lc(':',2,['..X..','.....','.....','.....','..X..']);lc('[',0,['.XXX.','.X...','.X...','.X...','.X...','.X...','.XXX.']);lc(']',0,['.XXX.','...X.','...X.','...X.','...X.','...X.','.XXX.']);lc('+',2,['..X..','..X..','XXXXX','..X..','..X..']);lc('=',2,['.....','XXXXX','.....','XXXXX']);lc('<',1,['...X.','..X..','.X...','..X..','...X.']);lc('>',1,['.X...','..X..','...X.','..X..','.X...']);lc('*',1,['.....','X.X.X','.XXX.','X.X.X']);lc('#',1,['.X.X.','XXXXX','.X.X.','XXXXX','.X.X.']);lc('%',0,['XX..X','XX.X.','...X.','..X..','.X...','.X.XX','X..XX']);
const ADV = 6;
function eachDot(str, font, cb) { let gx = 0; for (const ch of str) { const g = font[ch] || font['?']; for (let r = 0; r < g.length; r++) for (let c = 0; c < 5; c++) if (g[r][c] === 'X') cb(gx + c, r); gx += ADV; } }
const measure = (str, dot) => (str.length * ADV - 1) * dot;
function textCtx(ctx, str, x, y, color, dot = 2, font = BOOK) { ctx.fillStyle = css(color); eachDot(str, font, (dx, dy) => ctx.fillRect(x + dx * dot, y + dy * dot, dot, dot)); }
function textF(S, str, x, y, color, dot = 2, font = BOOK) { eachDot(str, font, (dx, dy) => S.rect(x + dx * dot, y + dy * dot, dot, dot, color)); }
// Menu font on the fine grid: 3×3 dots, diagonal elbows bridged by 1 fine px, 1-fine drop shadow.
function menuHD(S, str, x, y, color, shadow) {
  const on = new Set(); eachDot(str, MENU, (dx, dy) => on.add(dx + ',' + dy));
  const has = (a, b) => on.has(a + ',' + b);
  const T = new F(S.x0, S.y0, S.w, S.h);
  for (const k of on) { const [a, b] = k.split(',').map(Number); T.rect(x + a * 3, y + b * 3, 3, 3, color);
    for (const [da, db] of [[1, 1], [-1, 1]]) if (has(a + da, b + db) && !has(a + da, b) && !has(a, b + db)) { const cx = da > 0 ? x + a * 3 + 3 : x + a * 3 - 1; T.set(cx, y + b * 3 + 2, color); T.set(da > 0 ? x + a * 3 + 2 : x + a * 3, y + b * 3 + 3, color); } }
  if (shadow != null) T.forInk((px, py) => { if (!T.ink(px + 1, py + 1)) S.set(px + 1, py + 1, shadow); });
  T.forInk((px, py, c) => S.set(px, py, c));
}
function wrap(str, cols) { const out = []; let line = ''; for (const w of str.split(' ')) { if ((line + (line ? ' ' : '') + w).length > cols) { out.push(line); line = w; } else line += (line ? ' ' : '') + w; } if (line) out.push(line); return out; }
