'use strict';
// The Potting Shed's interior: generated from rooms, so the ASCII rows, the
// cutaway map, the backdrop regions and the light sources all come from one list.
// 120 wide × 88 tall. Ground floor walks on row 50 (the shed's own floor).
const SHED = (() => {
  const W = 120, H = 88, GROUND = 50;
  const g = []; for (let y = 0; y < H; y++) g.push(Array(W).fill(y < GROUND ? 'j' : 'e'));
  const roomAt = Array.from({length: H}, () => Array(W).fill(-1));
  const rooms = [], lights = [], props = [], critters = [], landmarks = [];
  const set = (x, y, ch) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch; };
  const put = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, ch); };
  const carve = (x0, y0, x1, y1, ri) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { set(x, y, '.'); if (ri != null && roomAt[y][x] < 0) roomAt[y][x] = ri; } };
  function room(id, name, kind, x0, y0, x1, y1, amb, floor) { const r = {id, name, kind, x0, y0, x1, y1, amb, floor}; rooms.push(r); r.i = rooms.length - 1; carve(x0, y0, x1, y1, r.i); return r; }
  const door = (x, y, r) => carve(x, y - 1, x, y, r.i);           // 2-tall opening, standing on row y+1
  const ladder = (x, y0, y1) => { for (let y = y0; y <= y1; y++) set(x, y, 'H'); };
  const light = (x, y, r, warm, str = 0.55) => lights.push({x, y, r, warm, str});
  const prop = (name, col, row, opts = {}) => props.push({name, col, row, ...opts}); // row: floor tile row (base sits on its top) or, hang:true, ceiling tile row + 1
  const critter = (kind, col, row, opts = {}) => critters.push({kind, col, row, ...opts});

  // ---- GROUND FLOOR ----------------------------------------------------------------
  const shed = room('shed', 'The Shed', 'shed', 6, 44, 12, 49, 0.72);       // exactly the 7×6 tiles of the outside
  const hall = room('hall', 'Seed Hall', 'drawers', 14, 33, 59, 49, 0.66);
  door(13, 49, hall);
  put(14, 41, 22, 41, 'T');                                               // west gallery
  for (let i = 0; i < 7; i++) put(36 - 2 * i, 48 - i, 37 - 2 * i, 48 - i, 'T');   // the stair
  put(51, 41, 59, 41, 'T'); ladder(50, 41, 49);                           // east gallery + ladder
  ladder(30, GROUND, 58);                                                 // trapdoor to the apple store
  const lumber = room('lumber', 'Lumber Room', 'rafters', 3, 35, 12, 40, 0.34); door(13, 40, lumber);
  const kitchen = room('kitchen', 'Kitchen', 'kitchen', 61, 42, 84, 49, 0.58); door(60, 49, kitchen);
  put(76, 46, 80, 46, 'T'); ladder(74, 41, 49);
  const pantry = room('pantry', 'Pantry', 'kitchen', 86, 44, 97, 49, 0.42); door(85, 49, pantry);
  put(88, 48, 95, 48, 'T');
  // ---- FLOOR 1 ----------------------------------------------------------------------
  const library = room('library', 'Library', 'wallGreen', 61, 33, 84, 40, 0.54); door(60, 40, library);
  put(63, 39, 64, 40, 'L'); put(66, 37, 67, 40, 'L'); ladder(82, 32, 40);
  const sewing = room('sewing', 'Sewing Room', 'wallRose', 86, 33, 97, 40, 0.5); door(85, 40, sewing);
  // ---- FLOOR 2 ----------------------------------------------------------------------
  const loft = room('loft', 'Drying Loft', 'rafters', 14, 24, 59, 31, 0.52);
  ladder(16, 32, 40); ladder(40, 23, 31);
  const landing = room('landing', 'Narrow Landing', 'wallGreen', 61, 28, 97, 31, 0.44); door(60, 31, landing);
  // ---- ATTIC ------------------------------------------------------------------------
  const attic = room('attic', 'The Attic', 'rafters', 14, 5, 84, 22, 0.32); put(14, 0, 84, 22, 'j');
  for (let c = 14; c <= 84; c++) carve(c, 5 + Math.floor(Math.abs(c - 50) / 2.4), c, 22, attic.i);
  put(40, 21, 41, 21, 'T'); put(43, 19, 44, 19, 'T'); put(46, 17, 54, 17, 'T');
  const bedroom = room('bedroom', 'Eaves Bedroom', 'wallRose', 86, 14, 97, 22, 0.4); put(86, 0, 97, 22, 'j');
  for (let c = 86; c <= 97; c++) carve(c, 14 + Math.floor((c - 86) / 3), c, 22, bedroom.i);
  door(85, 22, bedroom);
  // ---- STAIRWELL + DUMBWAITER (the spine, attic to basement) -------------------------
  const stairs = room('stairs', 'The Stairwell', 'shed', 99, 16, 106, 58, 0.38);
  for (const y of [23, 32, 41, GROUND]) put(99, y, 106, y, 'T');
  ladder(100, 16, 58);
  for (const y of [22, 31, 40, 49, 58]) door(98, y, stairs);
  const shaft = room('shaft', 'Dumbwaiter', 'shed', 108, 24, 108, 58, 0.3); ladder(108, 24, 58);
  for (const y of [31, 40, 49, 58]) { door(107, y, shaft); door(109, y, shaft); }
  const boxroom = room('box', 'Box Room', 'rafters', 110, 26, 117, 31, 0.3);
  const linen = room('linen', 'Linen Cupboard', 'wallRose', 110, 35, 117, 40, 0.32);
  const boot = room('boot', 'Boot Room', 'shed', 110, 44, 117, 49, 0.34);
  // ---- BASEMENT ---------------------------------------------------------------------
  const apple = room('apple', 'Apple Store', 'brick', 14, 52, 40, 58, 0.3);
  const cellar = room('cellar', 'Preserves Cellar', 'brick', 42, 52, 70, 58, 0.28); door(41, 58, cellar);
  put(46, 55, 52, 55, 'T'); put(58, 55, 64, 55, 'T'); put(44, 57, 44, 57, 'T'); put(56, 57, 56, 57, 'T');
  const boiler = room('boiler', 'Boiler Room', 'brick', 72, 51, 97, 58, 0.32); door(71, 58, boiler);
  const coal = room('coal', 'Coal Hole', 'brick', 110, 53, 117, 58, 0.2);
  // ---- TUNNELS ----------------------------------------------------------------------
  const tunW = room('tunW', 'West Tunnel', 'earth', 16, 63, 58, 65, 0.22); ladder(20, 59, 65);
  const mole = room('mole', "Mole's Chamber", 'earth', 40, 60, 54, 65, 0.25);
  const tunE = room('tunE', 'East Tunnel', 'earth', 56, 63, 96, 65, 0.2); ladder(92, 59, 65);
  carve(62, 66, 62, 67, tunE.i);                                          // a hole in the floor…
  const pool = room('pool', 'The Still Pool', 'cave', 60, 68, 78, 74, 0.17);
  put(63, 75, 75, 77, 'W'); light(69, 73, 6, false, 0.28);
  const deep = room('deep', 'Deep Tunnel', 'earth', 79, 78, 107, 80, 0.14);
  ladder(79, 66, 80);                                                     // …and the long ladder back up, on down to the deep tunnel
  const roots = room('roots', 'Root Chamber', 'earth', 108, 74, 117, 80, 0.15);

  // ---- surfaces: floorboards wherever a house floor meets air, stone in the basement, roots over the tunnels
  for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y][x], above = g[y - 1][x], below = y + 1 < H ? g[y + 1][x] : 'e';
    if (y <= GROUND && c === 'j' && (above === '.' || above === 'H')) g[y][x] = 'f';
    if (y === GROUND && c === 'e') g[y][x] = 'f';
    if (y > GROUND && y <= 59 && x >= 13 && x <= 118 && c === 'e') g[y][x] = 'K';
    if (y > 59 && c === 'e' && below === '.') g[y][x] = x % 9 === 0 ? 'T' : 'r';
  }

  // ---- props, lights, creatures, landmarks (cols / rows in tiles) ---------------------
  prop('shedWindow', 10.6, 47.6); prop('pottingBench', 10, 50); prop('pots', 7.4, 50); prop('rake', 12.4, 50); prop('shedDoor', 7, 50);
  light(10.6, 46, 4, false, 0.35);
  for (const c of [19, 31, 45, 56]) { prop('lampHang', c, 33, {hang: true}); light(c + 0.5, 34.4, 6, true, 0.5); }
  prop('drawerCabinet', 26, 50); prop('drawerCabinet', 54, 50); prop('pots', 47, 50);
  landmarks.push({id: 'grandfather-clock', name: 'Grandfather Clock', col: 43, row: 50, body: 'grandfatherClock', sketch: 'clockSketch',
    text: 'A tall clock in the seed hall, ticking politely. Its hands do not go round the dial: they wind inward, a little further every hour, toward the middle.'});
  prop('stove', 66, 50); light(66.5, 47.6, 6.5, true, 0.5); prop('herbs', 63, 42, {hang: true}); prop('onions', 71, 42, {hang: true});
  prop('kitchenTable', 79, 50); prop('candle', 80, 48.2); light(80.5, 47.5, 3, true, 0.35); prop('jars', 78.5, 46);
  critter('cat', 70, 50);
  prop('jars', 90, 48); prop('jars', 94, 48); prop('appleCrate', 88, 50); prop('candle', 96, 50); light(96.5, 48.4, 3.5, true, 0.4);
  critter('mouse', 92, 50, {min: 87, max: 96});
  prop('desk', 77, 41); light(78, 38.6, 5, true, 0.55); critter('bookworm', 66.5, 37, {min: 66.2, max: 67.8});
  landmarks.push({id: 'seed-catalogue', name: 'Seed Catalogue', col: 71, row: 41, body: 'seedCatalogue', sketch: 'catalogueSketch',
    text: 'Every seed the garden has ever grown, drawn and named in a careful hand. The last page has a packet glued in, labelled only with the spiral, and it is full.'});
  prop('dressForm', 89, 41); prop('lampHang', 93, 33, {hang: true}); light(93.5, 34.4, 5, true, 0.5); prop('trunk', 95, 41);
  for (const [c, k] of [[17, 'lavender'], [21, 'herbs'], [25, 'onions'], [29, 'lavender'], [34, 'herbs'], [44, 'onions'], [48, 'lavender'], [52, 'herbs'], [56, 'lavender']]) prop(k, c, 24, {hang: true});
  for (const c of [27, 50]) { prop('smallWindow', c, 27.6); light(c + 0.5, 26.6, 4.5, false, 0.4); }
  prop('candle', 70, 32); light(70.5, 30.4, 3.5, true, 0.4); prop('trunk', 77, 32); prop('candle', 90, 32); light(90.5, 30.4, 3.5, true, 0.4); prop('pots', 84, 32);
  prop('trunk', 24, 23); prop('sheetedTrunk', 31, 23); prop('rockingHorse', 37, 23); prop('sheetedTrunk', 62, 23); prop('trunk', 70, 23);
  prop('skylight', 50, 7.6); light(50.5, 9, 7, false, 0.5); critter('moth', 50, 12, {rx: 3, ry: 1.4}); critter('moth', 51, 13, {rx: 2.2, ry: 1});
  critter('spider', 72, 14, {len: 4});
  prop('bed', 90, 23); prop('candle', 87, 23); light(87.5, 21.4, 3, true, 0.4);
  landmarks.push({id: 'wrong-size-window', name: 'Wrong-Size Window', col: 94, row: 23, body: 'wrongWindow', sketch: 'windowSketch', light: [94.5, 20, 5, false, 0.55],
    text: 'The shed\'s little window, the one with the pot in it. From the garden it is the size of a tea tray. From up here it is the size of a door, and the pot is the same pot.'});
  for (const y of [23, 32, 41, GROUND]) { prop('candle', 104, y); light(104.5, y - 1.6, 3, true, 0.35); }
  landmarks.push({id: 'dumbwaiter', name: 'Dumbwaiter', col: 112, row: GROUND, body: 'dumbwaiter', sketch: 'dumbwaiterSketch',
    text: 'A box on a rope, for sending things between floors. There is a cup of tea in it, still warm, and no one to say who it was sent to.'});
  prop('trunk', 113, 41); prop('sheetedTrunk', 113, 32); prop('appleCrate', 114, 59);
  for (const c of [17, 21, 33, 37]) prop('appleCrate', c, 59); prop('lampHang', 26, 52, {hang: true}); light(26.5, 53.4, 5, true, 0.45);
  critter('mouse', 24, 59, {min: 15, max: 29});
  prop('jars', 49, 55); prop('jars', 61, 55); prop('jars', 55, 59); prop('candle', 56, 55); light(56.5, 53.4, 4, true, 0.45);
  prop('boiler', 82, 59); light(82, 56.5, 7, true, 0.6); prop('pipes', 78, 51, {hang: true}); prop('pipes', 90, 51, {hang: true});
  for (const c of [24, 31, 36, 58, 66, 86]) prop('roots', c, 63, {hang: true});
  for (const c of [44, 51]) prop('roots', c, 60, {hang: true});
  prop('lampHang', 47, 60, {hang: true}); light(47.5, 61.4, 5, true, 0.45);
  critter('mole', 46, 66, {min: 41, max: 53}); critter('spider', 28, 63, {len: 1.2}); critter('worm', 70, 66, {min: 64, max: 78});
  for (const c of [84, 92, 100, 105]) prop('roots', c, 78, {hang: true});
  for (const c of [110, 113, 116]) prop('roots', c, 74, {hang: true});
  critter('worm', 92, 81, {min: 82, max: 104}); critter('worm', 63, 81 - 6, {min: 60.2, max: 62.4});
  landmarks.push({id: 'root-map', name: 'Root Map', col: 113, row: 81, body: 'rootMap', sketch: 'rootMapSketch',
    text: 'At the end of the last tunnel the roots of the garden come through the wall, and someone has labelled them: pear, bean, sunflower, well. Followed far enough, they all turn the same way.'});
  for (const l of landmarks) if (l.light) light(...l.light);

  const rows = g.map(r => r.join(''));
  const door0 = {id: 'shed-return-door', col: 7, row: GROUND, target: 'kitchen-garden', targetSpawn: 'from-shed', label: 'go out'};
  const spawns = [{id: 'from-garden', col: 8, row: GROUND - 1}, {id: 'tunnels', col: 22, row: 65}];
  return {W, H, GROUND, rows, g, roomAt, rooms, lights, props, critters, landmarks, door: door0, spawns};
})();

// ---- Reachability (tile-level port of the movement rules) ---------------------------
// Standing cell: passable, with solid (or a ladder's top) under it, or a ladder cell.
// Walk ±1 then fall; jump up ≤ 2 rows with ≤ 3 cols of drift and headroom; jump across ≤ 3
// cols; climb ladders; pop off a ladder's top onto the ledge beside it.
SHED.reach = (() => {
  const {W, H, g} = SHED;
  const solidCh = new Set(['j', 'f', 'T', 'L', 'e', 'r', 'K', 'S', 'B', 'F', 'D']);
  const tile = (x, y) => (x < 0 || x >= W || y >= H) ? 'j' : y < 0 ? '.' : g[y][x];
  const solid = (x, y) => solidCh.has(tile(x, y));
  const free = (x, y) => !solid(x, y);
  const lad = (x, y) => tile(x, y) === 'H';
  const stand = (x, y) => free(x, y) && (solid(x, y + 1) || lad(x, y) || lad(x, y + 1) || tile(x, y) === 'W' || tile(x, y + 1) === 'W');
  const fall = (x, y) => { while (y < H && free(x, y) && !stand(x, y)) y++; return stand(x, y) ? [x, y] : null; };
  const key = (x, y) => y * W + x;
  function next(x, y) {
    const out = [], add = p => p && out.push(p);
    for (const d of [-1, 1]) if (free(x + d, y)) add(fall(x + d, y));
    if (lad(x, y) || tile(x, y) === 'W') { if (free(x, y - 1)) out.push([x, y - 1]); if (free(x, y + 1)) add(fall(x, y + 1) || [x, y + 1]); }
    if (lad(x, y + 1)) out.push([x, y + 1]);
    if (lad(x, y) && free(x, y - 1) && !lad(x, y - 1)) for (const d of [-1, 1]) for (let k = 1; k <= 2; k++) if (free(x, y - k) && stand(x + d, y - k)) out.push([x + d, y - k]);
    if (solid(x, y + 1) || lad(x, y + 1)) {
      for (let up = 1; up <= 2; up++) { let ok = true; for (let k = 1; k <= up; k++) if (!free(x, y - k)) ok = false; if (!ok) break;
        for (const d of [-1, 1]) for (let dx = 1; dx <= 3; dx++) { let clear = true; for (let s = 1; s <= dx; s++) if (!free(x + d * s, y - up)) clear = false; if (!clear) break; if (stand(x + d * dx, y - up)) out.push([x + d * dx, y - up]); } }
      if (free(x, y - 1)) for (const d of [-1, 1]) for (let dx = 1; dx <= 3; dx++) { if (!free(x + d * dx, y - 1) || !free(x + d * dx, y)) break; add(fall(x + d * dx, y)); }
    }
    return out;
  }
  const start = [SHED.door.col + 1, SHED.door.row - 1];
  const nodes = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (stand(x, y)) nodes.push([x, y]);
  const fwd = new Set([key(...start)]), q = [start], radj = new Map();
  for (const [x, y] of nodes) for (const [nx, ny] of next(x, y)) { const k = key(nx, ny); if (!radj.has(k)) radj.set(k, []); radj.get(k).push([x, y]); }
  while (q.length) { const [x, y] = q.shift(); for (const p of next(x, y)) { const k = key(...p); if (!fwd.has(k)) { fwd.add(k); q.push(p); } } }
  const back = new Set([key(...start)]), q2 = [start];
  while (q2.length) { const [x, y] = q2.shift(); for (const p of radj.get(key(x, y)) || []) { const k = key(...p); if (!back.has(k)) { back.add(k); q2.push(p); } } }
  const inRooms = nodes.filter(([x, y]) => SHED.roomAt[y][x] >= 0);
  const lost = inRooms.filter(([x, y]) => !fwd.has(key(x, y)) || !back.has(key(x, y)));
  return {total: inRooms.length, lost, fwd, back, stand, solid, tile};
})();
