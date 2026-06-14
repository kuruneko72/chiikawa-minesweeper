class MinesweeperGame {
    constructor() {
        // 难度配置
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        
        // 表情和图标
        this.emojis = {
            usagi: '🐰',
            flag: '🚩',
            happy: '😊',
            cool: '😎',
            dead: '😵',
            win: '🎉'
        };
        
        this.currentDifficulty = 'beginner';
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        
        // 游戏状态
        this.board = [];
        this.cells = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        
        // 音效元素
        this.soundManager = window.soundManager;
        
        // DOM 元素
        this.boardElement = document.getElementById('game-board');
        this.mineCountElement = document.getElementById('mine-count');
        this.timerElement = document.getElementById('timer');
        this.resetButton = document.getElementById('reset-btn');
        this.gameStatusElement = document.getElementById('game-status');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.newGame();
    }
    
    bindEvents() {
        // 难度选择按钮
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDifficulty = e.target.dataset.difficulty;
                this.newGame();
            });
        });
        
        // 重置按钮
        this.resetButton.addEventListener('click', () => {
            this.playSound('click');
            this.newGame();
        });
    }
    
    playSound(type) {
        if (this.soundManager) {
            switch(type) {
                case 'explode':
                    this.soundManager.playExplode();
                    break;
                case 'click':
                    this.soundManager.playClick();
                    break;
                case 'win':
                    this.soundManager.playWin();
                    break;
            }
        }
    }
    
    newGame() {
        // 重置游戏状态
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.elapsedSeconds = 0;
        
        // 清除计时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 更新显示
        this.updateMineCount();
        this.updateTimer();
        this.resetButton.textContent = '😊';
        this.gameStatusElement.textContent = '';
        this.gameStatusElement.className = 'game-status';
        
        // 初始化棋盘
        this.initBoard();
        this.renderBoard();
    }
    
    initBoard() {
        // 初始化空棋盘
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    placeMines(firstRow, firstCol) {
        // 在第一次点击后放置地雷（确保第一次点击不是地雷）
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            // 不在第一次点击的位置及其周围放置地雷
            if (Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1) {
                continue;
            }
            
            if (!this.board[r][c].isMine) {
                this.board[r][c].isMine = true;
                minesPlaced++;
            }
        }
        
        // 计算相邻地雷数
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) continue;
                
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                            if (this.board[nr][nc].isMine) count++;
                        }
                    }
                }
                this.board[r][c].neighborMines = count;
            }
        }
    }
    
    renderBoard() {
        // 清空棋盘
        this.boardElement.innerHTML = '';
        
        // 设置棋盘网格
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 35px)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 35px)`;
        
        // 创建格子
        this.cells = [];
        let cellCount = 0;
        for (let r = 0; r < this.rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // 事件监听
                cell.addEventListener('click', (e) => this.handleClick(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });
                
                this.boardElement.appendChild(cell);
                this.cells[r][c] = cell;
                cellCount++;
            }
        }
    }
    
    handleClick(row, col) {
        if (this.gameOver || this.gameWon) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 第一次点击
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        // 播放点击音效
        this.playSound('click');
        
        // 如果是地雷
        if (cell.isMine) {
            this.gameOver = true;
            this.revealAllMines();
            this.resetButton.textContent = this.emojis.dead;
            this.gameStatusElement.textContent = '游戏结束！乌萨奇爆炸了！💥';
            this.gameStatusElement.className = 'game-status lose';
            this.stopTimer();
            this.playSound('explode');
            return;
        }
        
        // 揭开格子
        this.revealCell(row, col);
        
        // 检查是否获胜
        if (this.checkWin()) {
            this.gameWon = true;
            this.handleWin();
        }
    }
    
    handleRightClick(row, col) {
        if (this.gameOver || this.gameWon) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed) return;
        
        // 切换标记状态
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
            this.cells[row][col].classList.remove('flagged');
            this.cells[row][col].textContent = '';
        } else {
            cell.isFlagged = true;
            this.flagCount++;
            this.cells[row][col].classList.add('flagged');
            this.cells[row][col].textContent = this.emojis.flag;
        }
        
        this.updateMineCount();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.revealedCount++;
        
        const cellElement = this.cells[row][col];
        cellElement.classList.add('revealed');
        cellElement.classList.remove('flagged');
        
        if (cell.neighborMines > 0) {
            cellElement.textContent = cell.neighborMines;
            cellElement.dataset.number = cell.neighborMines;
        } else {
            // 如果是空格子，递归揭开周围的格子
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (!this.board[nr][nc].isRevealed) {
                            this.revealCell(nr, nc);
                        }
                    }
                }
            }
        }
    }
    
    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) {
                    this.cells[r][c].classList.add('revealed', 'mine', 'exploded');
                    this.cells[r][c].textContent = this.emojis.usagi;
                }
            }
        }
    }
    
    checkWin() {
        return this.revealedCount === (this.rows * this.cols - this.mineCount);
    }
    
    handleWin() {
        this.resetButton.textContent = this.emojis.cool;
        this.gameStatusElement.textContent = '恭喜你！成功保护了乌萨奇！🎉';
        this.gameStatusElement.className = 'game-status win';
        this.stopTimer();
        this.playSound('win');
        
        // 标记所有剩余的地雷
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine && !this.board[r][c].isFlagged) {
                    this.board[r][c].isFlagged = true;
                    this.cells[r][c].classList.add('flagged');
                    this.cells[r][c].textContent = '🚩';
                }
            }
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        const display = String(this.elapsedSeconds).padStart(3, '0');
        this.timerElement.textContent = display;
    }
    
    updateMineCount() {
        const remaining = this.mineCount - this.flagCount;
        this.mineCountElement.textContent = String(Math.max(0, remaining)).padStart(3, '0');
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});
