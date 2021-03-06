const aStar = require('a-star')

const adjacents = [ { x: 0, y: 1 }, { x: 1, y : 0 }, { x: 0, y: -1 }, { x: -1, y: 0 } ]  // up, right, down, left

function manhattanDist(p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
}

function isInBounds(width, height, coord) {
  const { x, y } = coord
  return (x >= 0 && x < width) && (y >= 0 && y < height) 
}

function translateMove(from, to) {
  if (to.x < from.x) return 'left'
  if (to.x > from.x) return 'right'
  if (to.y < from.y) return 'up'
  return 'down'
}

function moveToClosestFood(data) {
  const headPos = data.you.body[0]
  const tailPos = data.you.body[data.you.length - 1]
  const { width, height } = data.board
  const obstacles = new Set()
  const snakeLength = data.you.body.length

  data.board.snakes.forEach(snake => {
    const head = snake.body[0]
    snake.body.forEach(coord => {
      obstacles.add(JSON.stringify(coord))
    })
    
    if (snake.body.length < snakeLength) {
      obstacles.delete(head)
      return
    }

    if (snake.id === data.you.id) return
    
    // Play it safe and don't try to cut off the snake
    adjacents.map(adj => ({ x: head.x + adj.x, y: head.y + adj.y }))
             .forEach(coord => obstacles.add(JSON.stringify(coord)))
  })
  if (!data.justEaten) obstacles.delete(JSON.stringify(tailPos))
  obstacles.delete(JSON.stringify(headPos))

  console.log('obstacles:')
  console.log(Array.from(obstacles))

  const closestFoodPos = data.board.food.reduce(
    (closest, curr) => (manhattanDist(closest, headPos) <= manhattanDist(curr, headPos) ? closest : curr),
    data.board.food[0])

  console.log(`closest food: ${JSON.stringify(closestFoodPos)}`)

  const { status, path } = aStar({
    start: headPos,
    isEnd: p => p.x == closestFoodPos.x && p.y == closestFoodPos.y,
    neighbor: p => {
      const n = adjacents.map(adj => ({ x: p.x + adj.x, y: p.y + adj.y }))
                            .filter(coord => isInBounds(width, height, coord) && !obstacles.has(JSON.stringify(coord)))
      console.log('neighbours:', n)
      return n
    },
    distance: manhattanDist,
    heuristic: p => manhattanDist(p, closestFoodPos),
    hash: p => JSON.stringify(p),
    timeout: 250
  })

  console.log(`status: ${status}`)
  console.log(path)

  const safeSpots = adjacents.map(adj => ({ x: headPos.x + adj.x, y: headPos.y + adj.y}))
                             .filter(coord => isInBounds(width, height, coord) && !obstacles.has(JSON.stringify(coord)))

  const snake_move = status === 'success' ? translateMove(headPos, path[1]) : translateMove(headPos, safeSpots[0])

  return snake_move
}

function moveToTail(data) {
  const headPos = data.you.body[0]
  const tailPos = data.you.body[data.you.body.length - 1]
  const { width, height } = data.board
  const obstacles = new Set()
  const snakeLength = data.you.body.length

  data.board.snakes.forEach(snake => {
    const head = snake.body[0]
    snake.body.forEach(coord => {
      obstacles.add(JSON.stringify(coord))
    })
    
    if (snake.body.length < snakeLength) {
      obstacles.delete(head)
      return
    }
  })
  if (!data.justEaten) obstacles.delete(JSON.stringify(tailPos))
  obstacles.delete(JSON.stringify(headPos))

  console.log('obstacles:')
  console.log(Array.from(obstacles))

  console.log(`tail pos: ${JSON.stringify(tailPos)}`)

  const { status, path } = aStar({
    start: headPos,
    isEnd: p => p.x == tailPos.x && p.y == tailPos.y,
    neighbor: p => {
      const n = adjacents.map(adj => ({ x: p.x + adj.x, y: p.y + adj.y }))
                            .filter(coord => isInBounds(width, height, coord) && !obstacles.has(JSON.stringify(coord)))
    //   console.log('neighbours:', n)
      return n
    },
    distance: manhattanDist,
    heuristic: p => manhattanDist(p, tailPos),
    hash: p => JSON.stringify(p),
    timeout: 250
  })

  console.log(`status: ${status}`)
  console.log(path)

  const safeSpots = adjacents.map(adj => ({ x: headPos.x + adj.x, y: headPos.y + adj.y}))
                             .filter(coord => isInBounds(width, height, coord) && !obstacles.has(JSON.stringify(coord)))

  const snake_move = status === 'success' ? translateMove(headPos, path[1]) : translateMove(headPos, safeSpots[0])

  return snake_move
}

function makeMove(data) {
    const body = data.you.body
    const isLongestSnake = 
        data.board.snakes.every(snake => snake.body.length < body.length || snake.id === data.you.id)
    const justEaten = (body[body.length - 1].x === body[body.length - 2].x) &&
                      (body[body.length - 1].y === body[body.length - 2].y)
    const chaseTail = data.you.health > 80 && isLongestSnake

    console.log('CHASE TAIL:', chaseTail)
    return chaseTail ? moveToTail({ ...data, justEaten }) : moveToClosestFood({ ...data, justEaten })
}

module.exports = {
    makeMove
}