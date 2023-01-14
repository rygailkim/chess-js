/**
 * If piece-on-square is equal to side-to-move 
 * then generate the moves for piece-on-square
 * @returns [to-add]
 */
function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

var GameBoard = {};

/**
 * Shows the piece status 
 */
GameBoard.pieces = new Array(BRD_SQ_NUM);

/**
 * Shows side of the game board
 */
GameBoard.side = COLOURS.WHITE;

/**
 * Tracks game moves; Game is draw is both players made 50 moves
 */
GameBoard.fiftyMove = 0;

/**
 * Maintains the half-moves 
 */
GameBoard.hisPly = 0;

GameBoard.history = [];

/**
 * Maintains the number of moves in the search tree
 */
GameBoard.ply = 0;

// 
GameBoard.enPas = 0;

/**
 * Tracks the castle permission (king/queen-side)
 */
GameBoard.castlePerm = 0;

/**
 * Holds the value of the material of each side of the given position
 */
GameBoard.material = new Array(2); // WHITE,BLACK material of pieces

/**
 * Keeps track of the piece number
 */
GameBoard.pceNum = new Array(13); // indexed by piece

// 
GameBoard.pList = new Array(14 * 10);

/**
 * Unique number that represents position on the board;
 * Used for repetition detection (as 3 times repetition detection is a draw)
 */
GameBoard.posKey = 0;


GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);
GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array( 14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);