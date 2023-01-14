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

/**
 * Generates hash key
 */
function GeneratePosKey() {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;

	// hash in unique numbers for each square if not empty or offboard
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {			
			finalKey ^= PieceKeys[(piece * 120) + sq];
		}		
	}

	// if white, then hash in SideKey
	if(GameBoard.side == COLOURS.WHITE) {
		finalKey ^= SideKey;
	}
	
	// if enPas is no square, then hash in enPas square
	if(GameBoard.enPas != SQUARES.NO_SQ) {		
		finalKey ^= PieceKeys[GameBoard.enPas];
	}
	
	// hash in castling permission
	finalKey ^= CastleKeys[GameBoard.castlePerm];
	
	return finalKey;
}

function UpdateListsMaterial() {	
	
	var piece,sq,index,colour;
	
	for(index = 0; index < 14 * 120; ++index) {
		GameBoard.pList[index] = PIECES.EMPTY;
	}
	
	for(index = 0; index < 2; ++index) {		
		GameBoard.material[index] = 0;		
	}	
	
	for(index = 0; index < 13; ++index) {
		GameBoard.pceNum[index] = 0;
	}
	
	for(index = 0; index < 64; ++index) {
		sq = SQ120(index);
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY) {
			
			colour = PieceCol[piece];		
			
			GameBoard.material[colour] += PieceVal[piece];
			
			GameBoard.pList[PCEINDEX(piece,GameBoard.pceNum[piece])] = sq;
			GameBoard.pceNum[piece]++;			
		}
	}
	
}

function ResetBoard() {
	
	var index = 0;
	
	// set all pieces to offboard
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		GameBoard.pieces[index] = SQUARES.OFFBOARD;
	}

	// loop through the 64 internal board as empty
	for(index = 0; index < 64; ++index) {
		GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
	}
	
	GameBoard.side = COLOURS.BOTH;
	GameBoard.enPas = SQUARES.NO_SQ;
	GameBoard.fiftyMove = 0;	
	GameBoard.ply = 0;
	GameBoard.hisPly = 0;	
	GameBoard.castlePerm = 0;	
	GameBoard.posKey = 0;
	GameBoard.moveListStart[GameBoard.ply] = 0;
	
}

function ParseFen(fen) {

	ResetBoard();
	
	var rank = RANKS.RANK_8;
    var file = FILES.FILE_A;
    var piece = 0;
    var count = 0;
    var i = 0;  
	var sq120 = 0;
	var fenCnt = 0; // fen[fenCnt]
	
	while ((rank >= RANKS.RANK_1) && fenCnt < fen.length) {
	    count = 1;
		switch (fen[fenCnt]) {
			case 'p': piece = PIECES.bP; break;
            case 'r': piece = PIECES.bR; break;
            case 'n': piece = PIECES.bN; break;
            case 'b': piece = PIECES.bB; break;
            case 'k': piece = PIECES.bK; break;
            case 'q': piece = PIECES.bQ; break;
            case 'P': piece = PIECES.wP; break;
            case 'R': piece = PIECES.wR; break;
            case 'N': piece = PIECES.wN; break;
            case 'B': piece = PIECES.wB; break;
            case 'K': piece = PIECES.wK; break;
            case 'Q': piece = PIECES.wQ; break;

            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                piece = PIECES.EMPTY;
                count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
                break;
            
            case '/':
            case ' ':
                rank--;
                file = FILES.FILE_A;
                fenCnt++;
                continue;  
            default:
                console.log("FEN error");
                return;

		}
		
		for (i = 0; i < count; i++) {	
			sq120 = FR2SQ(file,rank);            
            GameBoard.pieces[sq120] = piece;
			file++;
        }
		fenCnt++;
	} // while loop end
	
	//rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
	GameBoard.side = (fen[fenCnt] == 'w') ? COLOURS.WHITE : COLOURS.BLACK;
	fenCnt += 2;
	
	for (i = 0; i < 4; i++) {
        if (fen[fenCnt] == ' ') {
            break;
        }		
		switch(fen[fenCnt]) {
			case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
			case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
			case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
			case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
			default:	     break;
        }
		fenCnt++;
	}
	fenCnt++;	
	
	if (fen[fenCnt] != '-') {        
		file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
		rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();	
		console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);	
		GameBoard.enPas = FR2SQ(file,rank);		
    }
	
	GameBoard.posKey = GeneratePosKey();	
	UpdateListsMaterial();
}


GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);
GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array( 14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);