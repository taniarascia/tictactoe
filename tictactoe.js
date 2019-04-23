// State
//***********************************************************
const tokens = { x: 'x', o: 'o' }
const time = 1500

function createNewBoard() {
  return [['', '', ''], ['', '', ''], ['', '', '']]
}

let board = createNewBoard()
let score = { x: 0, o: 0 }
let currentPlayer = tokens.x

const printBoard = () => {
  board.forEach(row => {
    console.log(row)
  })
}

// View
//***********************************************************

const elCreator = (tag, className) => {
  const el = document.createElement(tag)
  if (className) el.classList.add(className)

  return el
}

const clearBoard = () => {
  let newBoard = createNewBoard()
  board = newBoard
  const cells = document.querySelectorAll('.col')

  cells.forEach(cell => {
    cell.textContent = ''
  })
}

const game = document.querySelector('#game')
const gameBoard = elCreator('div', 'board')

game.appendChild(gameBoard)

board.forEach((row, i) => {
  const boardRow = elCreator('div', 'row')
  boardRow.dataset.row = i
  gameBoard.appendChild(boardRow)

  row.forEach((col, j) => {
    const boardCol = elCreator('div', 'col')
    boardCol.dataset.col = j
    boardRow.appendChild(boardCol)
  })
})

const scoreBoard = elCreator('div', 'score')
scoreBoard.textContent = `x: ${score.x}, o: ${score.o}`
game.appendChild(scoreBoard)

const gameOver = condition => {
  const message = elCreator('div', 'win')
  message.textContent = condition ? 'Nobody wins!' : `${currentPlayer} wins!`
  game.append(message)

  setTimeout(() => {
    message.remove()
  }, time)
}

gameBoard.addEventListener('click', event => {
  const col = event.target
  const clicked = col.classList.contains('col')

  if (clicked && col.textContent === '') {
    const { col } = event.target.dataset
    const { row } = event.target.parentElement.dataset

    board[row][col] = currentPlayer
    event.target.textContent = currentPlayer

    let horizontalWin = false
    let verticalWin = false
    let diagonalWin = false

    if (
      board[row][0] === currentPlayer &&
      board[row][1] === currentPlayer &&
      board[row][2] === currentPlayer
    ) {
      horizontalWin = true
    }

    if (
      board[0][col] === currentPlayer &&
      board[1][col] === currentPlayer &&
      board[2][col] === currentPlayer
    ) {
      verticalWin = true
    }

    if (
      (board[0][0] === currentPlayer &&
        board[1][1] === currentPlayer &&
        board[2][2] === currentPlayer) ||
      (board[2][0] === currentPlayer &&
        board[1][1] === currentPlayer &&
        board[0][2] === currentPlayer)
    ) {
      diagonalWin = true
    }

    // Game win
    if (horizontalWin || verticalWin || diagonalWin) {
      // Update score state
      score[currentPlayer] += 1

      // Update score view
      scoreBoard.textContent = `x: ${score.x}, o: ${score.o}`

      gameOver()
      setTimeout(() => {
        clearBoard()
      }, time)
    } else {
      const boardState = board
        .map(row => {
          return row.filter(col => col === '')
        })
        .filter(row => row.length > 0)

      if (boardState.length < 1) {
        gameOver('lose')
        setTimeout(() => {
          clearBoard()
        }, time)
        printBoard()
      }
    }

    printBoard()

    // Change player
    currentPlayer = currentPlayer === tokens.x ? tokens.o : tokens.x
  }
})
