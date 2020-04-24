const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')
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


// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

app.post('/start', (request, response) => {
  console.log(`START [${request.body.game.id}]`)

  // Response data
  const data = {
    color: '#f582ae',
    headType: "pixel",
    tailType: "pixel"
  }

  return response.json(data)
})

app.post('/move', (request, response) => {
  const data = request.body;
  const headPos = data.you.body[0]
  const { width, height } = data.board
  const obstacles = new Set()

  data.board.snakes.forEach(snake => snake.body.forEach(coord => obstacles.add(JSON.stringify(coord))))
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
 
  const snake_move = translateMove(headPos, path[1])

  console.log("MOVE: " + snake_move);
  return response.json({ move: snake_move })
})

app.post('/end', (request, response) => {
  console.log("END");
  return response.json({ message: "ok" });
})

app.post('/ping', (request, response) => {
  return response.json({ message: "pong" });
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
