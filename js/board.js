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

/**
 * pce * 10 + pceNum where pceNum is index of piece
 */
GameBoard.pList = new Array(14 * 10);

/**
 * Unique number that represents position on the board;
 * Used for repetition detection (as 3 times repetition detection is a draw)
 */
GameBoard.posKey = 0;

function PrintBoard() {
	
	var sq,file,rank,piece;

	console.log("\nGame Board:\n");
	// prints each line of rank
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =(RankChar[rank] + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = GameBoard.pieces[sq];
			line += (" " + PceChar[piece] + " ");
		}
		console.log(line);
	}
	
	console.log("");
	var line = "   ";
	for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
		line += (' ' + FileChar[file] + ' ');	
	}
	
	console.log(line);
	console.log("side:" + SideChar[GameBoard.side] );
	console.log("enPas:" + GameBoard.enPas);
	line = "";	
	
	if(GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';
	if(GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';
	if(GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
	if(GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';
	console.log("castle:" + line);
	console.log("key:" + GameBoard.posKey.toString(16));
}

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

function PrintPieceLists() {

	var piece, pceNum;
	
	// loop for every piece type
	for(piece = PIECES.wP; piece <= PIECES.bK; ++piece) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[piece]; ++pceNum) {
			console.log('Piece ' + PceChar[piece] + ' on ' + PrSq( GameBoard.pList[PCEINDEX(piece,pceNum)] ));
		}
	}

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
			// console.log('piece' + piece + ' on ' + sq);
			colour = PieceCol[piece];		
			
			GameBoard.material[colour] += PieceVal[piece];
			
			GameBoard.pList[PCEINDEX(piece,GameBoard.pceNum[piece])] = sq;
			GameBoard.pceNum[piece]++;			
		}
	}

	PrintPieceLists();
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

//rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

function ParseFen(fen) {

	ResetBoard();

	var rank = RANKS.RANK_8;
    var file = FILES.FILE_A;
    var piece = 0;
    var count = 0;
    var i = 0;  
	var sq120 = 0;
	/**
	 * Represents position in FEN
	 */
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

			// convert integer to character
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
            
			// end of the final rank
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
	// castling
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
	
	// en passant
	if (fen[fenCnt] != '-') {        
		file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
		rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();	
		console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);	
		GameBoard.enPas = FR2SQ(file,rank);		
    }
	
	GameBoard.posKey = GeneratePosKey();	
	UpdateListsMaterial();
	PrintSqAttacked();
}

/**
 * Used to get a certain move
 */
GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);

/**
 * 'Index' for the first move at a given ply
 */
GameBoard.moveListStart = new Array(MAXDEPTH);

GameBoard.PvTable = [];
GameBoard.PvArray = new Array(MAXDEPTH);
GameBoard.searchHistory = new Array( 14 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);

/**
 * Prints the square/s that can be attacked by the current player
 */
function PrintSqAttacked() {
	
	var sq,file,rank,piece;

	console.log("\nAttacked:\n");
	
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(SqAttacked(sq, GameBoard.side^1) == BOOL.TRUE) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
		console.log(line);
	}
	
	console.log("");
	
}


/**
 * Checks if current piece is able to attack
 * @returns BOOL.TRUE if available to attack on position
 */
function SqAttacked(sq, side) {
	var pce;
	var t_sq;
	var index;
	
	// white pawn going forward
	if(side == COLOURS.WHITE) {
		if(GameBoard.pieces[sq - 11] == PIECES.wP || GameBoard.pieces[sq - 9] == PIECES.wP) {
			return BOOL.TRUE;
		}
	// black pawn going to the other direction
	} else {
		if(GameBoard.pieces[sq + 11] == PIECES.bP || GameBoard.pieces[sq + 9] == PIECES.bP) {
			return BOOL.TRUE;
		}	
	}
	
	// knight
	for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + KnDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKnight[pce] == BOOL.TRUE) {
			return BOOL.TRUE;
		}
	}

	// rook
	for(index = 0; index < 4; ++index) {		
		dir = RkDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceRookQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) {
					return BOOL.TRUE;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}
	
	// bishop
	for(index = 0; index < 4; ++index) {		
		dir = BiDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceBishopQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) {
					return BOOL.TRUE;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}
	
	// king
	for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + KiDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKing[pce] == BOOL.TRUE) {
			return BOOL.TRUE;
		}
	}
	
	return BOOL.FALSE;
	

}