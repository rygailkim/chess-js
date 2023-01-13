var GameBoard = {};

// shows the piece status
GameBoard.pieces = new Array(BRD_SQ_NUM);

// side of the game board
GameBoard.side = COLOURS.WHITE;

// if both players made 50 moves, game is a draw
GameBoard.fiftyMove = 0;

// maintains the half move
GameBoard.hisPly = 0;

// 
GameBoard.history = [];

// maintains the moves in the search tree
GameBoard.ply = 0;

GameBoard.enPas = 0;

// tracks the castle permission (king/queen-side)
GameBoard.castlePerm = 0;


GameBoard.material = new Array(2); // WHITE,BLACK material of pieces
GameBoard.pceNum = new Array(13); // indexed by Pce
GameBoard.pList = new Array(14 * 10);
GameBoard.posKey = 0;
GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);
GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array( 14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);