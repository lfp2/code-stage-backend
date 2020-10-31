const querystring = require('querystring')
const request = require('request')
const { generateRandomString } = require('../utils/index.js')
const { STATE_KEY } = require('../../constants.js')

const client_id = process.env.CLIENT_ID
const redirect_uri = 'http://localhost:3000/callback/'
const client_secret = process.env.CLIENT_SECRET

export const getAuthorization = function (req, res) {
  var state = generateRandomString(16)
  res.cookie(STATE_KEY, state)

  var scope = 'user-read-private user-read-email'
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

export const validateAuthorization = function (req, res) {
  var code = req.query.code || null
  var state = req.query.state || null
  var storedState = req.cookies ? req.cookies[STATE_KEY] : null

  if (state === null || state !== storedState) {
    res.redirect(
      '/#' +
        querystring.stringify({
          error: 'state_mismatch',
        })
    )
  } else {
    res.clearCookie(STATE_KEY)
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
          console.log(body)
        })

        // we can also pass the token to the browser to make requests from there
        res.redirect(
          '/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        )
      } else {
        res.redirect(
          '/#' +
            querystring.stringify({
              error: 'invalid_token',
            })
        )
      }
    })
  }
}
