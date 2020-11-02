const querystring = require('querystring')
const request = require('request')
const { generateRandomString } = require('../utils/index.js')
const { STATE_KEY } = require('../../constants.js')
const firebase = require('../firebase/index.js')

const client_id = process.env.CLIENT_ID
const redirect_uri = 'http://localhost:3000/playlists'
const client_secret = process.env.CLIENT_SECRET
const db = firebase.firestore()
const userRef = db.collection('users')

export const getAuthorization = function (req, res) {
  var state = generateRandomString(16)
  res.cookie(STATE_KEY, state)

  var scope = 'user-read-private user-read-email user-top-read'
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  )
}

export const validateAuthorization = async function (req, res) {
  const { code } = req.query

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        new Buffer.from(client_id + ':' + client_secret).toString('base64'),
    },
    json: true,
  }

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token

      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { Authorization: 'Bearer ' + access_token },
        json: true,
      }

      // use the access token to access the Spotify Web API
      request.get(options, function (error, response, body) {
        userRef.doc(body.id).set(body)
        console.log(body)
      })
      res.status(200).json({
        access_token,
        refresh_token,
        user_id: body.id,
      })
    } else {
      res.status(400).send('Invalid token')
    }
  })
}
