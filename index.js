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
const strategy = require('./strategy.js')


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
  const snake_move = strategy.makeMove(request.body);

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
