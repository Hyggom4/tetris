const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');


const nextCanvas = document.getElementById('nextBlockCanvas');
const nextCtx = nextCanvas.getContext('2d');


const rows = 20;
const columns = 10;
const blockSize = 30;


let score = 0;
let startTime = null;
let timerInterval;
let autoDropInterval;
let isGameOver = false;


function createBoard(rows, columns) {
    const board = [];
    for (let row = 0; row < rows; row++) {
        board.push(new Array(columns).fill(0));
    }
    return board;
}


const gameBoard = createBoard(rows, columns);


const blocks = [
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'cyan' },
    { shape: [[1, 1], [1, 1]], color: 'yellow' },
    { shape: [[1, 1, 1, 1]], color: 'blue' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' },
    { shape: [[1]], color: 'purple' },
    { shape: [[1, 1], [1, 0], [1, 1]], color: 'pink' }
];


let currentBlock;
let currentX = 4;
let currentY = 0;
let nextBlock;


function updateTimer() {
    if (isGameOver) return;


    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);


    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;


    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');


    document.getElementById('timer').innerText = `Time: ${formattedHours}H ${formattedMinutes}M ${formattedSeconds}S`;
}


function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (gameBoard[row][col] !== 0) {
                ctx.fillStyle = gameBoard[row][col];
                ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize);
                ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
            } else {
                ctx.strokeStyle = 'gray';
                ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
            }
        }
    }
    document.getElementById('score').innerText = `Score: ${score}`;
}


function drawBlock(shape, color, x, y) {
    ctx.fillStyle = color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                ctx.fillRect((x + col) * blockSize, (y + row) * blockSize, blockSize, blockSize);
                ctx.strokeRect((x + col) * blockSize, (y + row) * blockSize, blockSize, blockSize);
            }
        }
    }
}


function lockBlock() {
    for (let row = 0; row < currentBlock.shape.length; row++) {
        for (let col = 0; col < currentBlock.shape[row].length; col++) {
            if (currentBlock.shape[row][col] !== 0) {
                gameBoard[currentY + row][currentX + col] = currentBlock.color;
            }
        }
    }
    clearFullRows();
}


function clearFullRows() {
    let rowsCleared = 0;
    for (let row = 0; row < rows; row++) {
        if (gameBoard[row].every(cell => cell !== 0)) {
            gameBoard.splice(row, 1);
            gameBoard.unshift(new Array(columns).fill(0));
            rowsCleared++;
        }
    }


    if (rowsCleared > 0) {
        score += (100 * rowsCleared) + (500 * (rowsCleared - 1));
    }


    document.getElementById('score').innerText = `Score: ${score}`;
}


function drawNextBlock() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const shape = nextBlock.shape;
    const offsetX = Math.floor((nextCanvas.width / blockSize - shape[0].length) / 2);
    const offsetY = Math.floor((nextCanvas.height / blockSize - shape.length) / 2);
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                nextCtx.fillStyle = nextBlock.color;
                nextCtx.fillRect((col + offsetX) * blockSize, (row + offsetY) * blockSize, blockSize, blockSize);
                nextCtx.strokeRect((col + offsetX) * blockSize, (row + offsetY) * blockSize, blockSize, blockSize);
            }
        }
    }
}


function setNextBlock() {
    nextBlock = blocks[Math.floor(Math.random() * blocks.length)];
    drawNextBlock();
}


function spawnAndDrawNewBlock() {
    if (isGameOver) return;


    currentBlock = nextBlock || blocks[Math.floor(Math.random() * blocks.length)];
    currentX = 4;
    currentY = 0;
    setNextBlock();


    if (!canMove(currentX, currentY)) {
        showGameOver();
        return;
    }
    draw();
}


function moveBlock(event) {
    if (isGameOver) return;


    if (!startTime) {
        startTime = new Date();
        timerInterval = setInterval(updateTimer, 1000);
        autoDropInterval = setInterval(autoDrop, 500);
    }
    if (event.key === 'ArrowLeft') {
        if (canMove(currentX - 1, currentY)) {
            currentX -= 1;
        }
    } else if (event.key === 'ArrowRight') {
        if (canMove(currentX + 1, currentY)) {
            currentX += 1;
        }
    } else if (event.key === 'ArrowDown') {
        if (canMove(currentX, currentY + 1)) {
            currentY += 1;
        } else {
            lockBlock();
            spawnAndDrawNewBlock();
        }
    } else if (event.key === 'ArrowUp') {
        rotateBlock();
    }
    draw();
}


function autoDrop() {
    if (isGameOver) return;


    if (canMove(currentX, currentY + 1)) {
        currentY += 1;
    } else {
        lockBlock();
        spawnAndDrawNewBlock();
    }
    draw();
}


function rotateBlock() {
    if (isGameOver) return;


    const newShape = currentBlock.shape[0].map((_, index) =>
        currentBlock.shape.map(row => row[index]).reverse()
    );
    if (canMove(currentX, currentY, newShape)) {
        currentBlock.shape = newShape;
    }
}


function canMove(newX, newY, shape = currentBlock.shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                const x = newX + col;
                const y = newY + row;


                if (y >= rows || x < 0 || x >= columns || gameBoard[y][x] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}


function draw() {
    drawBoard();
    drawBlock(currentBlock.shape, currentBlock.color, currentX, currentY);
}


function showGameOver() {
    isGameOver = true;


    clearInterval(timerInterval);
    clearInterval(autoDropInterval);


    const overlay = document.getElementById('gameOverOverlay');
    overlay.classList.add('active');
    overlay.style.display = 'flex';
}


function restartGame() {
    const overlay = document.getElementById('gameOverOverlay');
    overlay.classList.remove('active');
    overlay.style.display = 'none';


    isGameOver = false;
    location.reload();
}


window.onload = () => {
    const overlay = document.getElementById('gameOverOverlay');
    overlay.style.display = 'none';
};


document.getElementById('restartButton').addEventListener('click', restartGame);
document.addEventListener('keydown', moveBlock);


spawnAndDrawNewBlock();