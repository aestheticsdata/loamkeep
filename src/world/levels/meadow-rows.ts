// The meadow's tilemap, 200 × 96 — from design_handoff_meadow_v3 (the
// annotated map, "Prairie v3 - Carte"). Four surface zones of 50 columns each
// (forest edge, stream & mill, wheat field, cliff) over four underground
// networks, joined at the bottom by the Great Gallery (rows 86-88).
//
// Legend (see CHAR_TO_TILE in tilemap.ts):
//   . empty   G grass   D dirt   S stone   K dark stone   W water
//   B castle brick   F castle floor   P gold pillar   T timber   H ladder
//   U puffball   g granite   j plank wall   V vine   X bramble
//
// The handoff's rows had not been played (its README says so), and
// meadow.test.ts walked them to find where they broke. They differ from the
// handoff where it did, and only there:
//   - the long canopy vine (col 22) ran up under the row-3 branch: the
//     branch starts at col 23;
//   - the Root Shaft has the ledges the handoff's map describes ("zigzag
//     every 3 rows") and the generated rows had lost, left level with the
//     Root Hall's and the Maze's floors;
//   - the ravine (cols 39-42) has a tile more lip, so it can be jumped;
//   - the cliff chimney's vine moved a column east, under its opening, and
//     the Old Nest's ledge reaches it;
//   - the secret chimney (col 191) has a foothold at the top of the
//     puffball's bounce, one under the grass, and its top one under the gap;
//   - the Great Gallery's thorns are two tiles across, not three, under a
//     vault high enough for the jump over them;
//   - the field's brambles are three tiles across, not four: the hay bale
//     beside them, pushed in, is the way over, and off it four left a jump
//     that landed a pixel or two short of the last;
//   - every ladder that stopped in mid-air above a room (Millstone Hall, the
//     keep's trapdoor, the cellars') reaches the floor under it;
//   - Millstone Hall's platforms are a row lower, in reach of a jump;
//   - the cistern's columns are arched over its walkway and under its
//     pools, so the walkway is one and the pools join;
//   - the barrel cellar's second block is four tiles tall, and its shelf a
//     row lower, in reach off a barrel;
//   - water stands only in a basin (meadow.test.ts checks it): the cistern's
//     west pool is walled off from the Root Shaft, the way between them a
//     doorway at its walkway instead; the cavern lake under the stream has
//     banks; the Black Pool's lobe out in the shaft is rock under its
//     surface; the ladder down to Millstone Hall rises through the river in
//     a stone tube; the lake's outflow and the cistern's cascade run on down
//     into the water they feed; and the Crystal Lake's floor is closed, its
//     west shore a row lower to climb out by.
export const MEADOW_ROWS = [
  '........................................................................................................................................................................................................', // 0
  '........................................................................................................................................................................................................', // 1
  '........................................................................................................................................................................................................', // 2
  '.......................TTTTTTTT.........................................................................................................................................................................', // 3
  '......................V........................................................................................................................................................GGGGGGGGGGGGGGGG.GGGGGGGG', // 4
  '......................V........................................................................................................................................................SSSSSSSSSSSSSSS...SSSSSSS', // 5
  '......................V........................................................................................................................................................SSSSSSSSSSSSSSSS..SSSSSSS', // 6
  '......................V....................................................................................................................................................SSS.SSSSSSSSSSSSSSS.g.SSSSSSS', // 7
  '......................V........................................................................................................................................................SSSSSSSSSSSSSSS...SSSSSSS', // 8
  '......................V........................................................................................................................................................SSSSSSSSSSSSSSS..gSSSSSSS', // 9
  '......................V......................................................................................................................................GGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGG...GGGGGGG', // 10
  '.................TTTTTTTTT...................................................................................................................................D.....V......DDDDDDDDDDDDDDDDDDDD...DDDDDDD', // 11
  '................V............TTTTT..........................................TTTTTTTTT........................................................................S.....V.SSSS.SSSSSSSSSSSSSSSSSSSSg..SSSSSSS', // 12
  '................V...........V................................................jjjjjjj.........................................................................S.....V......SSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 13
  '........TTTTTT..V...........V................................................jjjjjjj.........................................................................SSSSSSV......SSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 14
  '................V...........V................................................jjjjjjj.........................................................................S.....V......SSSSSSSSSSSSSSSSSSSS..gSSSSSSS', // 15
  '................V...........V................................................jjjjjjj..........................TTTTTTT........................................S.....V....XXSSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 16
  '...TTTTT........V...........V................................................jjjjjjj..........................T.....T................................................SSSSSSSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 17
  '................V...........V................................................jjjjjjj.....GGGGGGGG.............T.....T.....................................................SSSSSSSSSSSSSSSSSSSSg..SSSSSSS', // 18
  '................V...........V................................................jjjjjjj.....SSSSSSSS.............T.....T....XXX.....S..S.....................................SSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 19
  'GGGGG...GGGGGGGGGGGGGGGG..GGGGGGGGGGGGG...GGGGGGGGG.VGGGGGGG....S....S....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..HGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG...GGGGGGG', // 20
  'DDDDDD..DDDDDDDDDDDDDDD....DDDDDDDDDDD....DDDDDDDD..VDDDDDDDWWWWSWWWWSWWWWDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..HDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...gDDDDDDD', // 21
  'DDDDDD...DDDDDDDDDDDDDD....DDDDDDDDDDDD.....DDDDDD..VDDDDDDDWWWWSWWWWSWWWWSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS..HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSS', // 22
  'DD....................D...DDDDDDDDDDDD......DDDDDD..VDDDDDDDWWWWSWWWWSWWWWSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.HSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSSSS', // 23
  'D...........................DDDDDDDDDDD.....DDDDDD..VDDDDDDDKKKKKKWWKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.HKKKKKKKKKKKKKKKKKKKgggggggggggggggggggggggggggggggggggggggg..ggggggg', // 24
  'DD........................DDDDDDDDDDDD......D.......V.............WW............................KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.HKKKKKKKKKKKKKKKKKKKggggggggggggggggggg.g..gggggg.gg..g.g.....g.g.ggg', // 25
  'DDDDDDDDDDDD.DDDDDDDDD......DDDDDDDDDDD....DDDD.....V.............WW............................KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.HKKKKKKKKKKKKKKKKKKKggggggggggggggggggg...........................ggg', // 26
  'DDDDDDDDDDDD.DDDDDDDDDDD............................V............KWWWWWWWWWWWWWWWWWWWWWWWK...............................................KKKKKKKKKKKKKKggggggggggggggggggg......................g....ggg', // 27
  'DDDDDDDDDDDD.DDDDDDDDDDDDD..........................VKKK..DD.....KWWWWWWWWWWWWWWWWWWWWWWWK...............................................KKKKKKKKKKKKKKggggggggggggggggggg..........ggggg............ggg', // 28
  'DDDDDDDDDDDD.DDDDDDDDDDDDDDD........................V.....DDKKKKWWWWWKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...............KKKKKKKKKKKKKKggggggggggggggggggg...........................ggg', // 29
  'DDDDDDDDDD.....DDDDDDDDDDDDDDDDDDDDDDDHDDDDDDDD....KKK....DDKKKKWWWWWKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKHKKKKKKKKKKKKKKKKKKKKKKggggggggggggggggggg..................ggggg....ggg', // 30
  'DDDDDDDDDD.........................DDDHDDDDDDDD..........DDDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggggg...........................ggg', // 31
  'DDDDDDDDDD.........................DDDHDDDDDDDD...........DDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggggg...........................ggg', // 32
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDDDKK........DDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBggggggg.......................................ggg', // 33
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDD..........DDDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBggggggg....................U............U.....ggg', // 34
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDD..........DDDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBBBBBBBBBBBBBggggggg..............gggggggggggggggggggggggggggg', // 35
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDD....KKK...DDDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKK...............P.......H...P.......P........BBgggggg...............gggggggggggggggggggggggggggg', // 36
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDD..........DDDKKWWWWWWWWWWWWWWWWWWWKKKKKKKKKKKKKKKKKKKKKKKK...............P.......H...P.......P........BBggggggg......gggg....gggggggggggggggggggggggggggg', // 37
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDD..........DDDDKKKKKKKKKKWWWKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...............P.......H...P.......P...............................gggggggggggggggggggggggggggg', // 38
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD..DDDHDDDDDDDDKKK......DDDDKKKKKKKKKKWWWKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK................P.......H...P.......P...............................gggggggggggggggggggggggggggg', // 39
  'KKKK.........................................K........................WWW.......KK......................................P.......H...P.......P...............................gggggggggggggggggggggggggggg', // 40
  'KKKK......V.......V.......V.......V..........K........................WWW...............................................P.......H...P.......P...............................gggggggggggggggggggggggggggg', // 41
  'KKKK......V.......V.......V.......V..........K.....KKKKK.KWWKHKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB....BBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFBBgggggggg.ggg.........gggggggggggggggggggggggggggg', // 42
  'KKKK......V.......V.......V.TTTTT.V..........K..........KKWWKHKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBHBBBBgggggggg.............gggggggggggggggggggggggggggg', // 43
  'KKKK......V.TTTTT.V.......V.......V..........K...........KKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWB........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBHBBBBgggggggg.............gggg......gg........gg.....g', // 44
  'KKKK......V.......V.......V.......V..........K.KKK.......KKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWB........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBHBBBBggggggggg......................gg........gg.....g', // 45
  'KKKK......V.......V.TTTTT.V.......V..........K...........KKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWB........................................H..BBggggggggg......................gg........gg.....g', // 46
  'KKKK......V.......V.......V.......V.TTTTT....K...........KKKKHKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKWWWB.....BB.................................H..BBggggggggg......................gg........gg.....g', // 47
  'KKKK......V.......V.......V.......V..........KK....KKK...KKK.H..................................KKKKKKWWWB........................................H..BBgggggggg........ggg............gg........gg.....g', // 48
  'KKKK......V...............V.......V..........KK...........KK.H..................................KKKKKKWWWBBB......................................H..BBgggggggg............ggggg......gg........gg.....g', // 49
  'KKKK......V...............V..................KK...........KK.H..................................KKKKKKWWWB........................................H..BBgggggggg............gggggWWWWWWWWWWWWWWWWWWWWWWWg', // 50
  'KKKK......V...............V....................KKK..KKKK..KK.H..........TTTTT...................KKKKKKWWWB........................................H..BBgggggggg.........ggggggggWWWWWWWWWWWWWWWWWWWWWWWg', // 51
  'KKKK......V...............V...............................KK.H..................................KKKKKKWWWB....BBBFFFFFFFHFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBgggggggg...........ggggggWWWWWWWWWWWWWWWWWWWWWWWg', // 52
  'KKKK......V...............................................KK.H..................................KKKKKKWWWB.......BBBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggg.............gggggWWWWWWWWWWWWWWWWWWWWWWWg', // 53
  'KKKK......V..................................KKKKKK.......KK.H....TTTTT...........TTTTT.........KKKKKKWWWB........BBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggg.....gggg...ggggggWWWWWWWWWWWWWWWWWWWWWWWg', // 54
  'KKKK................XXXXXXXX.................KK...........KK.H..................................KKKKKKWWWB........BBBBBBHBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggg............ggggggWWWWWWWWWWWWWWWWWWWWWWWg', // 55
  'KKKKKK..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK............K.H..........................XXX.....KKKKKKWWWBBB............H............................BBggggggg.............gggggWWWWWWWWWWWWWWWWWWWWWWWg', // 56
  'KKKKKK..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK....KKK.....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKWWWB..............H............................BBggggggg.............gggggWWWWWWWWWWWWWWWWWWWWWWWg', // 57
  'KKKKKK..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK............KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKWWWB..............H............................BBggggggg.............gggggWWWWWWWWWWWWWWWWWWWWWWWg', // 58
  'KKKKKK..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...........KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKWWWB...BB.........H..................FFFFFFFF..BBggg......................gggggggggggggggggggggggg', // 59
  'KKKKKK......KKK.................KKK..........K.KKK........KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKWWWB..............H............................BBggg...........................ggggggggggggggggggg', // 60
  'KKKKKK......KKK.................KKK..........K...........KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..KKKKKKKKWWWB..............H............................BBggg...........................ggggggggggggggggggg', // 61
  'KKKKKKWWWWWWKKKWWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWWWKKK......K........KK........KK........KK........KK....WWW...............H............................BBggg...........................ggggggggggggggggggg', // 62
  'KKKKKKWWWWWWKKKWWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWKK...KKKK..K........KK........KK........KK........KK....WWW...............H...BBB.......BBBB...........BBggg....................ggggg..ggggggggggggggggggg', // 63
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWWKK......................................................WWW...............H...BBB.......BBBB...........BBggg...........................ggggggggggggggggggg', // 64
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWK........................................................WWW...............H...BBB.......BBBB...........BBggg...........................ggggggggggggggggggg', // 65
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWK.KKKK.....KKTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTWWW...............H...BBB.......BBBB...........BBggg....ggggg..................ggggggggggggggggggg', // 66
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWKK.........KK........KK........KK........KK........KK....WWW.BBB.BBBFFFFFFFFFFFFFFFFFFFFFFFFFFFHFFFFFFFFBBggg...........................ggggggggggggggggggg', // 67
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWKK.........KK........KK........KK........KK........KK....WWW..........BBBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBggg..U........................ggggggggggggggggggg', // 68
  'KKKKKKWWWWWWKKKWWWWWWWKKKWWWWWWWKKKWWWWWKKKWWKK....KKKK.KK........KK........KK........KK........KK....WWW..........BBBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBggggggggggggggg.............ggggggggggggggggggggg', // 69
  'KKKKKKWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWWWWWKKKWWKK.........KKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB.........BBBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBggggggggggggggg................gggggggggggggggggg', // 70
  'KKKKKKWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWWWWWKKKWWKKK.........KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB.........BBBBBBBBBBBBBBBBBBBBBBBBBHBBBBBBBBBBggggggggggggggg................gggggggggggggggggg', // 71
  'KKKKKKWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWWWWWKKKWWKKKKK.......KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB.....BB...........................H........BBggggggggggggggg................gggggggggggggggggg', // 72
  'KKKKKKWWWWWWWWWWWWWWWWKKKWWWWWWWWWWWWWWWKKKWWKK..........KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB..................................H........BBgggggggggggg..........ggggg.ggggggggggggggggggggg', // 73
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB..................................H........BBgggggggggggg................ggggggggggggggggggggg', // 74
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...KKKKK.KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWBBBB...............................H........BBgggggggggggg................ggggggggggggggggggggg', // 75
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB..................................H........BBgggggggggggggggg.ggg.........gggggggggggggggggggg', // 76
  'KKKK..........K...............K................KKK.......KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB..................................H........BBgggggggggggggggg.............gggggggggggggggggggg', // 77
  'KKKK..........K...............K..........................KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB....BBB...........................H........BBggggggggggggggggg......gg....gggggggggggggggggggg', // 78
  'KKKK..........K...............K..........................KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB..................................H........BBggggggggggggggggg............gggggggggggggggggggg', // 79
  'KKKKKHKKKKHKKKKKKKKKKKKKHKKKKKKKKKHKKKKKHKKKKKKKKKK......KWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWWKKWWWWWWWB..................................H........BBgggggggggggggggggggg.........gggggggggggggggggggg', // 80
  'KKKK.H..K.H...........K.H.........H...K.H.................KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.....BBBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBBgggggggggggggggg.............gggggggggggggggggggg', // 81
  'KKKK.H..K.H...........K.H.........H...K.H..........KKK....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggg............gggggggggggggggggggg', // 82
  'KKKK.H..K.H...........K.H.....XX..H...K.H.................KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........BBBBBBBBBBBBBB.........BBBBBBBBBBBBBBgggggggggggggggg.....gg......gggggggggggggggggggg', // 83
  'KKKKKKKKKKKKHKKKKKHKKKKKKKKKHKKKKKKKKKKKKKKKHKKKKK........KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........BBBBBBBBBBBBBB.........BBBBBBBBBBBBBBgggggggggggggggg.............gggggggggggggggggggg', // 84
  'KKKK........H...K.H.........H...K...........H.........KK..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..........BBBBBBBBBBBBBB.........BBBBBBBBBBBBBBggggggggggggggg.........ggg..gggggggggggggggggggg', // 85
  'KKKK........H...K.H.........H...K...........H......KKK..............................................................................................................................gggggggggggggggggggg', // 86
  'KKKK........H...K.H...XX....H...K...........H......................................................................................................................................ggggggggggggggggggggg', // 87
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..................................K.......................................B.........XX...............................................ggggggggggggggggggggg', // 88
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggggggggggg.............ggggggggggggggggggggg', // 89
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggggggggggggggggggggggggggggggggggg', // 90
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggggggggggggggggggggggggggggggggggg', // 91
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBggggggggggggggggggggggggggggggggggggggggggggggggg', // 92
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // 93
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // 94
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // 95
] as const;
