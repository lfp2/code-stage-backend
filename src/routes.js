const { Router } = require('express')
const LoginController = require('./app/controllers/LoginController')

const routes = new Router()

routes.get('/login', LoginController.getAuthorization)
routes.get('/callback', LoginController.validateAuthorization)

module.exports = routes
