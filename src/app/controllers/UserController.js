const axios = require('axios')
const firebase = require('../firebase/index.js')
const db = firebase.firestore()
const tracksRef = db.collection('tracks')

export const getTopSpotify = async function (req, res) {
  const { access_token } = req.query
  var options = {
    headers: { Authorization: 'Bearer ' + access_token },
    json: true,
  }
  try {
    const { data: topResponse } = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks',
      options
    )
    const { items: topTracks } = topResponse
    await topTracks.forEach(async function (track) {
      const trackRef = tracksRef.doc(track.id)
      const doc = await trackRef.get()
      if (!doc.exists) {
        const { data: trackResponse } = await axios.get(
          `https://api.spotify.com/v1/audio-features/${track.id}`,
          options
        )
        trackRef.set({
          danceability: trackResponse.danceability,
          energy: trackResponse.energy,
          key: trackResponse.key,
          loudness: trackResponse.loudness,
          mode: trackResponse.mode,
          speechiness: trackResponse.speechiness,
          acousticness: trackResponse.acousticness,
          instrumentalness: trackResponse.instrumentalness,
          liveness: trackResponse.liveness,
          valence: trackResponse.valence,
          tempo: trackResponse.tempo,
          id: track.id,
          uri: track.uri,
          album: {
            id: track.album.id,
            images: track.album.images,
            name: track.album.name,
            release_date: track.album.release_date,
            release_date_precision: track.album.release_date_precision,
            uri: track.album.uri,
          },
          artists: track.artists,
          external_ids: track.external_ids,
          external_urls: track.external_urls,
          name: track.name,
          popularity: track.popularity,
          preview_url: track.preview_url,
        })
      }
    })

    res.status(200).send(topTracks)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error)
  }
}
