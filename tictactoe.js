class Display {
  /**
   * Bind document click to the game if clicked element is a cell
   */
  bindHandler(clickHandler) {
    document.addEventListener('click', event => {
      const clicked = event.target
      const isColumn = clicked.className === 'col'

      if (isColumn) {
        const cell = clicked
        const { row } = cell.parentElement.dataset
        const { col } = cell.dataset

        clickHandler(row, col)
      }
    })
  }

  /**
   * Create an element and apply an optional class and dataset
   * @return {Element}
   */
  createElement = (tag, className, dataset) => {
    const el = document.createElement(tag)
    if (className) el.classList.add(className)
    if (dataset) el.dataset[dataset[0]] = dataset[1]

    return el
  }

  /**
   * Retrieve an existing element in the DOM
   * @return {Element}
   */
  getElement = selector => {
    return document.querySelector(selector)
  }

  /**
   * Retrieve all elements by selector from the DOM
   * @return {Element}
   */
  getAllElements = selector => {
    return document.querySelectorAll(selector)
  }

  /**
   * Create the game board view and render it to the DOM
   */
  printGameBoard = boardData => {
    const game = this.getElement('#game')
    const gameBoard = this.createElement('div', 'board')

    game.append(gameBoard)

    boardData.forEach((row, i) => {
      const boardRow = this.createElement('div', 'row', ['row', i])
      gameBoard.append(boardRow)

      row.forEach((col, j) => {
        const boardCol = this.createElement('div', 'col', ['col', j])
        boardRow.append(boardCol)
      })
    })
  }

  /**
   * Update the board by appending a player token to a cell
   */
  updateBoard = (row, col, currentPlayer) => {
    const playerToken = this.createElement('span', currentPlayer)
    playerToken.textContent = currentPlayer

    const boardRow = this.getElement(`[data-row="${row}"]`)
    const cell = boardRow.querySelector(`[data-col="${col}"]`)

    cell.append(playerToken)
  }

  /**
   * Set all cells in the board to empty strings
   */
  clearGameBoard = () => {
    const cells = this.getAllElements('.col')

    cells.forEach(cell => {
      cell.textContent = ''
    })
  }

  /**
   * Create the score board view and render it to the DOM
   */
  printScoreBoard = scoreData => {
    const game = this.getElement('#game')
    const scoreBoard = this.createElement('div', 'score')

    game.append(scoreBoard)

    const playerOneScore = this.createElement('div', 'x')
    playerOneScore.textContent = `Player 1: ${scoreData.x}`
    playerOneScore.id = 'score-x'

    const playerTwoScore = this.createElement('div', 'o')
    playerTwoScore.textContent = `Player 2: ${scoreData.o}`
    playerTwoScore.id = 'score-o'

    scoreBoard.append(playerOneScore, playerTwoScore)
  }

  updateScore = (currentScore, currentPlayer) => {
    const currentPlayerScore = this.getElement(`#score-${currentPlayer}`)
    const player = currentPlayer === 'x' ? 'Player 1' : 'Player 2'

    currentPlayerScore.textContent = `${player}: ${currentScore[currentPlayer]}`
  }

  printMessage = winner => {
    const message = this.createElement('div', 'message')
    const player = winner === 'x' ? 'Player 1' : 'Player 2'

    message.textContent = winner ? `${player} wins!` : 'Nobody wins!'

    const game = this.getElement('#game')
    game.append(message)
  }

  clearMessage = () => {
    const message = this.getElement('.message')
    message.remove()
  }
}

class TicTacToe {
  /**
   * board - 3x3 multi-dimensional array of empty strings
   * players - Object representing the players
   * wait - Time in miliseconds after game over
   * score - Holds the score for players
   * currentPlayer - Current player, initialized to x
   * gameOver - A player has won or there's a stalemate
   * @param {class} display - User interface for interacting with the DOM
   */
  constructor(display) {
    this.display = display
    this.board = this.createBoard()
    this.players = { x: 'x', o: 'o' }
    this.wait = 1500
    this.waiting = false
    this.score = { x: 0, o: 0 }
    this.currentPlayer = this.players.x

    this.display.bindHandler(this.clickCell)
  }

  /**
   * Click a cell in the game board and determine if its a win, a stalemate, or the game continues.
   * Game over or switch player.
   */
  clickCell = (row, col) => {
    const canContinue = this.board[row][col] === ''

    if (canContinue && !this.waiting) {
      this.board[row][col] = this.currentPlayer
      this.display.updateBoard(row, col, this.currentPlayer)
    }

    const win = this.isGameWon(row, col)
    const stalemate = this.board
      .map(row => row.filter(col => col === ''))
      .filter(row => row.length > 0)

    if (!this.waiting) {
      if (win) {
        this.increaseScore()
        this.display.updateScore(this.score, this.currentPlayer)
        this.gameOver(this.currentPlayer)
      } else if (stalemate.length < 1) {
        this.gameOver()
      } else {
        this.switchPlayer()
      }
    }
  }

  /**
   * Reset the board after a delay after win or stalemate
   */
  gameOver = winner => {
    this.waiting = true
    this.display.printMessage(winner)

    setTimeout(() => {
      this.resetBoard()
      this.waiting = false
    }, this.wait)
  }

  /**
   * Create a new empty board
   * @return {array} 3x3 multi-dimensional array of empty strings
   */
  createBoard = () => [['', '', ''], ['', '', ''], ['', '', '']]

  /**
   * Restore the board to its original empty state
   */
  resetBoard = () => {
    this.display.clearMessage()
    this.display.clearGameBoard()
    this.board = this.createBoard()
  }

  /**
   * Check is the current player has won the game
   * @return {boolean}
   */
  isGameWon = (row, col) => {
    if (
      // Horizontal win
      (this.board[row][0] === this.currentPlayer &&
        this.board[row][1] === this.currentPlayer &&
        this.board[row][2] === this.currentPlayer) ||
      // Vertical win
      (this.board[0][col] === this.currentPlayer &&
        this.board[1][col] === this.currentPlayer &&
        this.board[2][col] === this.currentPlayer) ||
      // Diagonal win
      ((this.board[0][0] === this.currentPlayer &&
        this.board[1][1] === this.currentPlayer &&
        this.board[2][2] === this.currentPlayer) ||
        (this.board[2][0] === this.currentPlayer &&
          this.board[1][1] === this.currentPlayer &&
          this.board[0][2] === this.currentPlayer))
    )
      return true
    return false
  }

  /**
   * Switch to the next player
   */
  switchPlayer = () => {
    this.currentPlayer = this.currentPlayer === this.players.x ? this.players.o : this.players.x
  }

  /**
   * Increase the score of the winning player
   */
  increaseScore = () => {
    this.score[this.currentPlayer] += 1
  }

  /**
   * Render score board and game board
   */
  startGame() {
    this.display.printScoreBoard(this.score)
    this.display.printGameBoard(this.board)
  }
}

// Play Game
//********************************************************

const ticTacToe = new TicTacToe(new Display())
ticTacToe.startGame()
