// 게임 설정
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 캔버스 설정
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

// 게임 상태
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let dropTime = 0;
let dropInterval = 1000;

// 테트리스 블록 정의
const PIECES = [
    // I 블록
    {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00f5ff'
    },
    // O 블록
    {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00'
    },
    // T 블록
    {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#a000f0'
    },
    // S 블록
    {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00f000'
    },
    // Z 블록
    {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#f00000'
    },
    // J 블록
    {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000f0'
    },
    // L 블록
    {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#ff7f00'
    }
];

// 게임 보드 초기화
function initBoard() {
    board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
}

// 랜덤 블록 생성
function createPiece() {
    const pieceIndex = Math.floor(Math.random() * PIECES.length);
    const piece = JSON.parse(JSON.stringify(PIECES[pieceIndex]));
    piece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2);
    piece.y = 0;
    return piece;
}

// 블록 회전
function rotatePiece(piece) {
    const rotated = JSON.parse(JSON.stringify(piece));
    const n = rotated.shape.length;
    const newShape = [];
    
    for (let i = 0; i < rotated.shape[0].length; i++) {
        newShape[i] = [];
        for (let j = n - 1; j >= 0; j--) {
            newShape[i][n - 1 - j] = rotated.shape[j][i];
        }
    }
    
    rotated.shape = newShape;
    return rotated;
}

// 충돌 검사
function isValidMove(piece, dx = 0, dy = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                
                if (newX < 0 || newX >= BOARD_WIDTH || 
                    newY >= BOARD_HEIGHT || 
                    (newY >= 0 && board[newY][newX])) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 블록을 보드에 고정
function placePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// 완성된 라인 제거
function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 같은 줄을 다시 검사
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);
        updateScore();
    }
}

// 점수 업데이트
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 게임 보드 그리기
function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 보드 그리기
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
    
    // 현재 블록 그리기
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const drawX = (currentPiece.x + x) * BLOCK_SIZE;
                    const drawY = (currentPiece.y + y) * BLOCK_SIZE;
                    ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
}

// 다음 블록 그리기
function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const blockSize = 20;
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
        
        nextCtx.fillStyle = nextPiece.color;
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                    nextCtx.strokeStyle = '#fff';
                    nextCtx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }
}

// 게임 오버 체크
function isGameOver() {
    return !isValidMove(currentPiece);
}

// 게임 오버 처리
function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

// 게임 시작
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameRunning = true;
    
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    document.getElementById('game-over').classList.add('hidden');
    updateScore();
    
    gameLoop();
}

// 게임 루프
function gameLoop(timestamp = 0) {
    if (!gameRunning) return;
    
    if (timestamp - dropTime > dropInterval) {
        if (isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
        } else {
            placePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            
            if (isGameOver()) {
                gameOver();
                return;
            }
        }
        dropTime = timestamp;
    }
    
    drawBoard();
    drawNextPiece();
    requestAnimationFrame(gameLoop);
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (!gameRunning || !currentPiece) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            if (isValidMove(currentPiece, -1, 0)) {
                currentPiece.x--;
            }
            break;
        case 'ArrowRight':
            if (isValidMove(currentPiece, 1, 0)) {
                currentPiece.x++;
            }
            break;
        case 'ArrowDown':
            if (isValidMove(currentPiece, 0, 1)) {
                currentPiece.y++;
                score += 1;
                updateScore();
            }
            break;
        case 'ArrowUp':
            const rotated = rotatePiece(currentPiece);
            if (isValidMove(rotated)) {
                currentPiece = rotated;
            }
            break;
        case ' ':
            while (isValidMove(currentPiece, 0, 1)) {
                currentPiece.y++;
                score += 2;
            }
            updateScore();
            break;
    }
    e.preventDefault();
});

// 게임 시작
startGame();