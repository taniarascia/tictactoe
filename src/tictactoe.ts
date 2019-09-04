// Custom Types
//==============================================================================

interface PlayerToken {
  x: string
  o: string
  [key: string]: string
}

interface Score {
  x: number
  o: number
  [key: string]: number
}

interface Display {
  bindHandler(clickHandler: (row: number, col: number) => void): void
  createElement(tag: string, className?: string, dataset?: Array<any>): HTMLElement
  getElement(selector: string): HTMLElement
  getAllElements(selector: string): NodeList
  printGameBoard(boardData: Array<Array<string>>): void
  updateBoard(row: number, col: number, currentPlayer: string): void
  clearGameBoard(): void
  printScoreBoard(scoreData: Score): void
  updateScore(currentScore: Score, currentPlayer: string): void
  printMessage(winner?: string): void
  clearMessage(): void
}

// Display
//==================================================================================================

class DOMDisplay implements Display {
  /**
   * Bind document click to the game if clicked element is a cell
   * @param {requestCallback} clickHandler
   */
  bindHandler(clickHandler: (row: number, col: number) => void): void {
    document.addEventListener('click', (event: Event) => {
      const clicked = <HTMLElement>event.target
      const isColumn = clicked.className === 'col'

      if (isColumn) {
        const cell = clicked
        const row = +cell.parentElement!.dataset.row!
        const col = +cell.dataset.col!

        clickHandler(row, col)
      }
    })
  }

  /**
   * Create an element and apply an optional class and dataset
   * @param {string} tag
   * @param {string} className (Optional)
   * @param {Object[]} dataset (Optional)
   * @return {HTMLElement}
   */
  createElement = (tag: string, className?: string, dataset?: Array<any>): HTMLElement => {
    const element = document.createElement(tag)
    if (className) element.classList.add(className)
    if (dataset) element.dataset[dataset[0]] = dataset[1]

    return element
  }

  /**
   * Retrieve an existing element in the DOM
   * @param {string} selector
   * @return {HTMLElement}
   */
  getElement = (selector: string): HTMLElement => <HTMLElement>document.querySelector(selector)

  /**
   * Retrieve all elements by selector from the DOM
   * @param {string} selector
   * @return {NodeList}
   */
  getAllElements = (selector: string): NodeList => <NodeList>document.querySelectorAll(selector)

  /**
   * Create the game board view and render it to the DOM
   * @param {Object[]} boardData 3x3 multi-dimensional array of empty strings
   */
  printGameBoard = (boardData: Array<Array<string>>): void => {
    const game = this.getElement('#game')
    const gameBoard = this.createElement('div', 'board', undefined)

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
   * @param {number} row
   * @param {number} col
   * @param {string} currentPlayer
   */
  updateBoard = (row: number, col: number, currentPlayer: string): void => {
    const playerToken = this.createElement('span', currentPlayer, undefined)
    playerToken.textContent = currentPlayer

    const boardRow = this.getElement(`[data-row="${row}"]`)
    const cell = <HTMLElement>boardRow.querySelector(`[data-col="${col}"]`)

    cell.append(playerToken)
  }

  /**
   * Set all cells in the board to empty strings
   */
  clearGameBoard = (): void => {
    const cells = this.getAllElements('.col')

    cells.forEach(cell => {
      cell.textContent = ''
    })
  }

  /**
   * Create the score board view and render it to the DOM
   * @param {Score} scoreData
   */
  printScoreBoard = (scoreData: Score): void => {
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

  /**
   * Update the existing score for the current player
   * @param {Score} currentScore
   * @param {string} currentPlayer
   */
  updateScore = (currentScore: Score, currentPlayer: string): void => {
    const currentPlayerScore = this.getElement(`#score-${currentPlayer}`)
    const player = currentPlayer === 'x' ? 'Player 1' : 'Player 2'
    const d: number = currentScore[currentPlayer]
    currentPlayerScore.textContent = `${player}: ${d}`
  }

  /**
   * Print the win, lose, or stalemate message
   * @param {string} winner
   */
  printMessage = (winner: string): void => {
    const message = this.createElement('div', 'message')
    const player = winner === 'x' ? 'Player 1' : 'Player 2'

    message.textContent = winner ? `${player} wins!` : 'Nobody wins!'

    const game = this.getElement('#game')
    game.append(message)
  }

  /**
   * Clear message from the screen
   */
  clearMessage = (): void => {
    const message = this.getElement('.message')
    message.remove()
  }
}

// Model
//==============================================================================

class TicTacToe {
  /**
   * board - 3x3 multi-dimensional array of empty strings
   * players - Object representing the players
   * wait - Time in miliseconds after game over
   * score - Holds the score for players
   * currentPlayer - Current player, initialized to x
   * gameOver - A player has won or there's a stalemate
   * @param {Display} display - User interface for interacting with the DOM
   */
  display: Display
  board: Array<Array<string>>
  players: PlayerToken
  wait: number
  waiting: boolean
  score: Score
  currentPlayer: string

  constructor(display: Display) {
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
   * Click a cell in the game board and determine if its a win, a stalemate, or
   * the game continues. Game over or switch player.
   */
  clickCell = (row: number, col: number) => {
    const canContinue = this.board[row][col] === ''

    if (canContinue && !this.waiting) {
      this.board[row][col] = this.currentPlayer
      this.display.updateBoard(row, col, this.currentPlayer)

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
  }

  /**
   * Reset the board after a delay after win or stalemate
   */
  gameOver = (winner?: string) => {
    this.waiting = true
    this.display.printMessage(winner)

    setTimeout(() => {
      this.resetBoard()
      this.waiting = false
    }, this.wait)
  }

  /**
   * Create a new empty board
   * @return {Object[]} 3x3 multi-dimensional array of empty strings
   */
  createBoard = (): Array<Array<string>> => [['', '', ''], ['', '', ''], ['', '', '']]

  /**
   * Restore the board to its original empty state
   */
  resetBoard = (): void => {
    this.display.clearMessage()
    this.display.clearGameBoard()
    this.board = this.createBoard()
  }

  /**
   * Check is the current player has won the game
   * @param {number} row
   * @param {number} col
   * @return {boolean}
   */
  isGameWon = (row: number, col: number): boolean => {
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
  switchPlayer = (): void => {
    this.currentPlayer = this.currentPlayer === this.players.x ? this.players.o : this.players.x
  }

  /**
   * Increase the score of the winning player
   */
  increaseScore = (): void => {
    this.score[this.currentPlayer] += 1
  }

  /**
   * Render score board and game board
   */
  startGame(): void {
    this.display.printScoreBoard(this.score)
    this.display.printGameBoard(this.board)
  }
}

// Start Game
//==============================================================================

const ticTacToe = new TicTacToe(new DOMDisplay())
ticTacToe.startGame()
