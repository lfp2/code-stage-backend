const { Router } = require('express')
const LoginController = require('./app/controllers/LoginController')
const UserController = require('./app/controllers/UserController')

const routes = new Router()

routes.get('/login', LoginController.getAuthorization)
routes.get('/callback', LoginController.validateAuthorization)
routes.get('/top', UserController.getTopSpotify)

module.exports = routes
