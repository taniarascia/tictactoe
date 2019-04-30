"use strict";
// Custom Types
//==================================================================================================
// Display
//==================================================================================================
var DOMDisplay = /** @class */ (function () {
    function DOMDisplay() {
        var _this = this;
        /**
         * Create an element and apply an optional class and dataset
         * @param {string} tag
         * @param {string} className (Optional)
         * @param {Object[]} dataset (Optional)
         * @return {HTMLElement}
         */
        this.createElement = function (tag, className, dataset) {
            var element = document.createElement(tag);
            if (className)
                element.classList.add(className);
            if (dataset)
                element.dataset[dataset[0]] = dataset[1];
            return element;
        };
        /**
         * Retrieve an existing element in the DOM
         * @param {string} selector
         * @return {HTMLElement}
         */
        this.getElement = function (selector) {
            return document.querySelector(selector);
        };
        /**
         * Retrieve all elements by selector from the DOM
         * @param {string} selector
         * @return {NodeList}
         */
        this.getAllElements = function (selector) {
            return document.querySelectorAll(selector);
        };
        /**
         * Create the game board view and render it to the DOM
         * @param {Object[]} boardData 3x3 multi-dimensional array of empty strings
         */
        this.printGameBoard = function (boardData) {
            var game = _this.getElement('#game');
            var gameBoard = _this.createElement('div', 'board', undefined);
            game.append(gameBoard);
            boardData.forEach(function (row, i) {
                var boardRow = _this.createElement('div', 'row', ['row', i]);
                gameBoard.append(boardRow);
                row.forEach(function (col, j) {
                    var boardCol = _this.createElement('div', 'col', ['col', j]);
                    boardRow.append(boardCol);
                });
            });
        };
        /**
         * Update the board by appending a player token to a cell
         * @param {number} row
         * @param {number} col
         * @param {string} currentPlayer
         */
        this.updateBoard = function (row, col, currentPlayer) {
            var playerToken = _this.createElement('span', currentPlayer, undefined);
            playerToken.textContent = currentPlayer;
            var boardRow = _this.getElement("[data-row=\"" + row + "\"]");
            var cell = boardRow.querySelector("[data-col=\"" + col + "\"]");
            cell.append(playerToken);
        };
        /**
         * Set all cells in the board to empty strings
         */
        this.clearGameBoard = function () {
            var cells = _this.getAllElements('.col');
            cells.forEach(function (cell) {
                cell.textContent = '';
            });
        };
        /**
         * Create the score board view and render it to the DOM
         * @param {Score} scoreData
         */
        this.printScoreBoard = function (scoreData) {
            var game = _this.getElement('#game');
            var scoreBoard = _this.createElement('div', 'score');
            game.append(scoreBoard);
            var playerOneScore = _this.createElement('div', 'x');
            playerOneScore.textContent = "Player 1: " + scoreData.x;
            playerOneScore.id = 'score-x';
            var playerTwoScore = _this.createElement('div', 'o');
            playerTwoScore.textContent = "Player 2: " + scoreData.o;
            playerTwoScore.id = 'score-o';
            scoreBoard.append(playerOneScore, playerTwoScore);
        };
        /**
         * Update the existing score for the current player
         * @param {Score} currentScore
         * @param {string} currentPlayer
         */
        this.updateScore = function (currentScore, currentPlayer) {
            var currentPlayerScore = _this.getElement("#score-" + currentPlayer);
            var player = currentPlayer === 'x' ? 'Player 1' : 'Player 2';
            currentPlayerScore.textContent = player + ": " + currentScore[currentPlayer];
        };
        /**
         * Print the win, lose, or stalemate message
         * @param {string} winner
         */
        this.printMessage = function (winner) {
            var message = _this.createElement('div', 'message');
            var player = winner === 'x' ? 'Player 1' : 'Player 2';
            message.textContent = winner ? player + " wins!" : 'Nobody wins!';
            var game = _this.getElement('#game');
            game.append(message);
        };
        /**
         * Clear message from the screen
         */
        this.clearMessage = function () {
            var message = _this.getElement('.message');
            message.remove();
        };
    }
    /**
     * Bind document click to the game if clicked element is a cell
     * @param {requestCallback} clickHandler
     */
    DOMDisplay.prototype.bindHandler = function (clickHandler) {
        document.addEventListener('click', function (event) {
            var clicked = event.target;
            var isColumn = clicked.className === 'col';
            if (isColumn) {
                var cell = clicked;
                var row = cell.parentElement.dataset.row;
                var col = cell.dataset.col;
                clickHandler(row, col);
            }
        });
    };
    return DOMDisplay;
}());
// Model
//==================================================================================================
var TicTacToe = /** @class */ (function () {
    function TicTacToe(display) {
        var _this = this;
        /**
         * Click a cell in the game board and determine if its a win, a stalemate, or the game continues.
         * Game over or switch player.
         */
        this.clickCell = function (row, col) {
            var canContinue = _this.board[row][col] === '';
            if (canContinue && !_this.waiting) {
                _this.board[row][col] = _this.currentPlayer;
                _this.display.updateBoard(row, col, _this.currentPlayer);
            }
            var win = _this.isGameWon(row, col);
            var stalemate = _this.board
                .map(function (row) { return row.filter(function (col) { return col === ''; }); })
                .filter(function (row) { return row.length > 0; });
            if (!_this.waiting) {
                if (win) {
                    _this.increaseScore();
                    _this.display.updateScore(_this.score, _this.currentPlayer);
                    _this.gameOver(_this.currentPlayer);
                }
                else if (stalemate.length < 1) {
                    _this.gameOver();
                }
                else {
                    _this.switchPlayer();
                }
            }
        };
        /**
         * Reset the board after a delay after win or stalemate
         */
        this.gameOver = function (winner) {
            _this.waiting = true;
            _this.display.printMessage(winner);
            setTimeout(function () {
                _this.resetBoard();
                _this.waiting = false;
            }, _this.wait);
        };
        /**
         * Create a new empty board
         * @return {Object[]} 3x3 multi-dimensional array of empty strings
         */
        this.createBoard = function () { return [['', '', ''], ['', '', ''], ['', '', '']]; };
        /**
         * Restore the board to its original empty state
         */
        this.resetBoard = function () {
            _this.display.clearMessage();
            _this.display.clearGameBoard();
            _this.board = _this.createBoard();
        };
        /**
         * Check is the current player has won the game
         * @param {number} row
         * @param {number} col
         * @return {boolean}
         */
        this.isGameWon = function (row, col) {
            if (
            // Horizontal win
            (_this.board[row][0] === _this.currentPlayer &&
                _this.board[row][1] === _this.currentPlayer &&
                _this.board[row][2] === _this.currentPlayer) ||
                // Vertical win
                (_this.board[0][col] === _this.currentPlayer &&
                    _this.board[1][col] === _this.currentPlayer &&
                    _this.board[2][col] === _this.currentPlayer) ||
                // Diagonal win
                ((_this.board[0][0] === _this.currentPlayer &&
                    _this.board[1][1] === _this.currentPlayer &&
                    _this.board[2][2] === _this.currentPlayer) ||
                    (_this.board[2][0] === _this.currentPlayer &&
                        _this.board[1][1] === _this.currentPlayer &&
                        _this.board[0][2] === _this.currentPlayer)))
                return true;
            return false;
        };
        /**
         * Switch to the next player
         */
        this.switchPlayer = function () {
            _this.currentPlayer = _this.currentPlayer === _this.players.x ? _this.players.o : _this.players.x;
        };
        /**
         * Increase the score of the winning player
         */
        this.increaseScore = function () {
            _this.score[_this.currentPlayer] += 1;
        };
        this.display = display;
        this.board = this.createBoard();
        this.players = { x: 'x', o: 'o' };
        this.wait = 1500;
        this.waiting = false;
        this.score = { x: 0, o: 0 };
        this.currentPlayer = this.players.x;
        this.display.bindHandler(this.clickCell);
    }
    /**
     * Render score board and game board
     */
    TicTacToe.prototype.startGame = function () {
        this.display.printScoreBoard(this.score);
        this.display.printGameBoard(this.board);
    };
    return TicTacToe;
}());
// Start Game
//==================================================================================================
var ticTacToe = new TicTacToe(new DOMDisplay());
ticTacToe.startGame();
