// The Old Keep's tilemap, 200 × 90 — from design_handoff_level_03_old_keep_v2.
// Today's great hall is in the middle of it, tile for tile, at (+70, +30):
// rows 30-55, cols 70-130, opened to the kitchens (west wall, rows 45-47),
// the armoury (east wall, rows 34-36 and 45-47), the central stair (ceiling,
// cols 96-104) and the dungeons (basement floor, col 122). Around it, the
// castle on all four sides:
//
//   N · the ramparts and three towers, under the night sky (rows 0-19);
//   O · the west wing: the chapel, the kitchens, the service stair and the
//     larder (cols 4-66, rows 13-61);
//   P · the east wing: the barracks, the armoury, the treasury behind its
//     portcullis and the east tower stair (cols 129-197, rows 13-48);
//   Q · the dungeons with their seven cells, and the sewers under it all
//     (rows 52-86).
//
// The handoff checked these rows with the movement rules old-keep.test.ts
// uses, and they are as delivered but for two tiles:
//   - the breach into the chapel (cols 41-43) was four tiles across, the far
//     edge of a running jump (~56 px in the air against the 54 it needs), and
//     it is the only way along the wall walk to the west tower: col 40 is
//     wall walk again;
//   - the east tribune (row 24) reaches a column further west, to col 39:
//     from col 40, chandelier B at the east end of its swing was ~10 px out
//     of a jump's reach (swinging-chandelier.test.ts plays the route).
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   B CastleBrick   F CastleFloor   P GoldPillar (not solid)
//   T timber   H ladder   W water   X spikes (the hearth's embers at cols
//   21-23)   Y portcullis (a Portcullis entity; the tile is what it stands in)
export const OLD_KEEP_ROWS = [
  '........................................................................................................................................................................................................', //  0  night sky over the ramparts (rows 0-11)
  '.............................................................................................H..........................................................................................................', //  1
  '..BBBBBBBBBBBB...............................................................................HBBBBBBBBBBBBB.............................................................................................', //  2  the centre tower (cols 95-106) and its ladder (col 93) up to the Banner of the Keep
  '..BBBBBBBBBBBB...............................................................................HBBBBBBBBBBBBB.........................................................................BBBBBBBBBBBBBBBBBB..', //  3
  '..BB........BB...............................................................................HBBBBBBBBBBBBB.........................................................................BBBBBBBBBBBBBBBBBB..', //  4  the west tower (cols 2-13): the Watchman's Horn
  '..BB........BB...............................................................................HBBBBBBBBBBBBB.........................................................................BB..............BB..', //  5  the east tower (cols 180-197): the Signal Brazier
  '..BB........BB...............................................................................HBBBBBBBBBBBBB.........................................................................BB..............BB..', //  6
  '..BB........BB...............................................................................HBBBBBBBBBBBBB.........................................................................BB..............BB..', //  7
  '..BB........BB...............................................................................HBBBBBBBBBBBBB.........................................................................BB..............BB..', //  8
  '..BB.........................................................................................HBBBBBBBBBBBBB.........................................................................................BB..', //  9
  '..BB.........................................................................................HBBBBBBBBBBBBB.........................................................................................BB..', // 10
  '..BB.........................................................................................HBBBBBBBBBBBBB.........................................................................................BB..', // 11
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...FFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF....FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFF', // 12  THE WALL WALK, with the breaches into the chapel (cols 41-43) and the barracks (cols 140-143)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...BBBBBBBBBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 13
  'BBBB...............................................BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 14  the chapel (rows 14-31, cols 4-50): the chandeliers hang from its ceiling (row 13)
  'BBBB...............................................BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 15
  'BBBB...............................................BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 16
  'BBBB...............................................BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 17
  'BBBB...............................................BBBB.THTTTTTTT.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 18
  'BBBB...............................................BBBB..H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBTTHTTTTTTBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBTTHTTTTTTBBBBBB', // 19
  'BBBBTTTTTTTTTTT....................................BBBB..H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H......BBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBB..H......BBBBBB', // 20  the west tribune (cols 4-14): the Reliquary
  'BBBB.....................................................H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H......BBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBB..H......BBBBBB', // 21
  'BBBB.....................................................H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H......BBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBB..H......BBBBBB', // 22
  'BBBB.....................................................H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H......BBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBB..H......BBBBBB', // 23
  'BBBB...................................TTTTTTHTTTTTBBBB.TTTTTTTHT.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H......BBBBBBBBBBBBBBBBBBBBBBBBBBBB.................TTTTTTT......................BBBBBB..H......BBBBBB', // 24  the east tribune (cols 39-50) and the service stair (cols 55-65)
  'BBBB.........................................H.....BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBTTTTTTHTTBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBB..H......BBBBBB', // 25
  'BBBB.........................................H.....BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..............................................BBBBBBTTTTTTHTTBBBBBB', // 26
  'BBBB.........................................H.....BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBB.......TTTTTTT.............TTTTTTT........................H..BBBBBB', // 27  the barracks (rows 20-31, cols 133-178)
  'BBBB.........................................H.....BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..........................................................H..BBBBBB', // 28
  'BBBB.........................................H.....BBBB........H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..........................................................H..BBBBBB', // 29
  'BBBB.........................................H.....BBBB.THTTTTTTT.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..........................................................H..BBBBBB', // 30  TODAY'S HALL from here (rows 30-55, cols 70-130), its ceiling open at cols 96-104
  'BBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBBB..H........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBBBBBBBBBBBBBBBBBBBBBBBBFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBBBBBTTTTTTH..BBBBBB', // 31  the chapel floor; the barracks floor and the treasury lever (col 170)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H........BBBBBB.....PP......PP......PP.......H..........................BBBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 32
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H........BBBBBB.....PP......PP......PP.......H..........................BBBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB......H..BBBBBB', // 33
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H........BBBBBB.....PP......PP......PP.......H.................................H............................Y.........................H.....BBB', // 34  the armoury (rows 34-48, cols 131-197) and the treasury portcullis (col 165)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..H........BBBBBB.....PP......PP......PP.......H.................................H............................Y.........................H.....BBB', // 35
  'BBBB.....................................................H.........BBBBB.....PP......PP......PP.......H.................................H............................Y.........................H.....BBB', // 36  the kitchens (rows 36-48, cols 4-66)
  'BBBB.....................................................H.........BBBBB.....PP......PP......PP.......H..............FFFFFFFFFFFFBBBBTTTHTTTT........................Y.........................H.....BBB', // 37
  'BBBB.....................................................H.........BBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFF..H.................PP.......BBBB...H............................Y.........................H.....BBB', // 38
  'BBBB......................................TTTTTT.........H.........BBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..............PP.......BBBB...H............................Y.........................H.....BBB', // 39
  'BBBB.....................................................H.........BBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFF...........FFFFFFFFFFFFFFFFFFBBBB...H............................Y.........................H.....BBB', // 40
  'BBBB.....................................................H.........BBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFF.........FF..................BBBB...H............................Y.........................H.....BBB', // 41
  'BBBB.............TTTTT............TTTTTT.................H.........BBBBB.........................................................BBBB...H............................Y.........................H.....BBB', // 42
  'BBBB.....................................................H.........BBBBB.........................................................BBBB...H............................Y.........................H.....BBB', // 43
  'BBBB.....................................................H.........BBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFF......................BBBB...H............................Y.........................H.....BBB', // 44
  'BBBB.....TTTTTT...........TTTTTT.........................H..................PP......PP......PP..........................................H............................Y.........................H.....BBB', // 45
  'BBBB.....................................................H..................PP......PP......PP...............FFFFFFFFFFFFFFFFFFFF.......H............................Y.........................H.....BBB', // 46
  'BBBB.................XXX.................................H..................PP......PP......PP..........................................H.............XXXX...........Y.........................H.....BBB', // 47  the hearth embers (cols 21-23)
  'BBBBFFFFHFFFFFFFFFFFFFFFFFFFFF.HFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFFFFFFFFFFFFFFFFFFFBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBB', // 48  the kitchens, hall and armoury floors
  'BBBBBBBBHBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....PP..............PP..................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 49
  'BBBBBBBBHBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....PP..............PP..................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 50
  'BBBBBBBBHBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....PP..............PP...........FF.....................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 51
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 52  the larder (rows 52-61, cols 6-40) and the hall basement
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 53
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 54
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 55
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 56
  'BBBBBB..H......................HTTTTTTTT.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 57  the Cook's Shelf (cols 32-39)
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 58
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 59
  'BBBBBB..H......................H.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 60
  'BBBBBBFFFFFFFFFFFFFFFFFFFFFFFF.HFFFFFFFFFBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.H.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 61
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............B.........B.........B.........B.........B.......H...........B.........B......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 62  the dungeons (rows 62-70, cols 60-150): seven cell gates at rows 66-69
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............B.........B.........B.........B.........B.......H...........B.........B......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 63
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............B.........B.........B.........B.........B.......H...........B.........B......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 64
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............B.........B.........B.........B.........B.......H...........B.........B......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 65
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............Y...TTTT..Y...TTTT..Y.........Y...TTTT..Y.......H...........Y...TTTT..Y......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 66
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............Y.........Y.........Y.........Y.........Y.......H...........Y.........Y......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 67
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............Y.........Y.........Y.........Y.........Y.......H...........Y.........Y......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 68
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............Y.........Y.........Y.........Y.........Y.......H...........Y.........Y......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 69
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 70  the dungeon floor; the oubliette (cols 97-98)
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 71
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 72
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.HBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 73
  'BBBBBBBBBBBBBBBBBBBB...........H.........................................................................................................................................................BBBBBBBBBBBBBBB', // 74  the sewers (rows 74-86)
  'BBBBBBBBBBBBBBBBBBBB...........H.........................................................................................................................................................BBBBBBBBBBBBBBB', // 75
  'BBBBBBBBBBBBBBBBBBBB...........H.........................................................................................................................................................BBBBBBBBBBBBBBB', // 76
  'BBBBBBBBBBBBBBBBBBBB...........H.........................................................................................................................................................BBBBBBBBBBBBBBB', // 77
  'BBBBBBBBBBBBBBBBBBBBTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT....TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT..TTTTTTTTTTTTTTTTTTTTTT....TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTBBBBBBBBBBBBBBB', // 78  the walkways, level with the water
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 79  the sewer water, flowing west; the sluice gate (col 170)
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 80
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 81
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 82
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 83
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 84
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 85
  'BBBBBBBBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWYWWWWWWWWWWWWWWBBBBBBBBBBBBBBB', // 86
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 87
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 88
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // 89
] as const;
