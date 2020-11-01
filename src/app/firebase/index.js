const admin = require('firebase-admin')

const serviceAccount = require('./firebase.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mood-code-stage.firebaseio.com',
})

module.exports = admin
