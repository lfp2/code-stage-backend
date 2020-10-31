const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const cookieParser = require('cookie-parser')

class App {
  constructor() {
    this.server = express()
      .use(express.static(__dirname + '/public'))
      .use(cors())
      .use(cookieParser())

    this.middlewares()
    this.routes()
  }

  middlewares() {
    this.server.use(express.json())
  }

  routes() {
    this.server.use(routes)
  }
}

module.exports = new App().server
