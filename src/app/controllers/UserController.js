const axios = require('axios')
const firebase = require('../firebase/index.js')
const db = firebase.firestore()
const tracksRef = db.collection('tracks')
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3')
const { IamAuthenticator } = require('ibm-watson/auth')

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
        await setTrackInfo(track, options, trackRef)
        await setLyrics(track, trackRef)
      }
    })

    res.status(200).send(topTracks)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error)
  }
}

const setTrackInfo = async function (track, options, trackRef) {
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

const setLyrics = async function (track, trackRef) {
  const apiKey = process.env.API_KEY
  const artist = track['artists'][0]['name']
  const {
    data: {
      message: {
        body: { track_list },
      },
    },
  } = await axios.get(
    `http://api.musixmatch.com/ws/1.1/track.search?apikey=${apiKey}&q_track=${track.name}&q_artist=${artist}&page_size=1`
  )
  if (track_list[0]['track']['has_lyrics']) {
    const trackId = track_list[0]['track']['track_id']
    const {
      data: {
        message: {
          body: { lyrics },
        },
      },
    } = await axios.get(
      `http://api.musixmatch.com/ws/1.1/track.lyrics.get?apikey=${apiKey}&track_id=${trackId}`
    )
    const cleanLyrics = lyrics.lyrics_body
      .replace('******* This Lyrics is NOT for Commercial use *******\n', '')
      .replace('(1409620776172)', '')
      .replace('\n', ' ')

    const toneAnalyzer = new ToneAnalyzerV3({
      version: '2020-11-01',
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_API_KEY,
      }),
      serviceUrl: process.env.WATSON_URL,
    })

    const toneParams = {
      toneInput: { text: cleanLyrics },
      contentType: 'application/json',
      acceptLanguage: 'en',
      sentences: 'false',
    }

    const toneAnalysis = await toneAnalyzer.tone(toneParams)

    trackRef.update({
      lyrics: cleanLyrics,
      musixmatch_id: trackId,
      document_tone: toneAnalysis.result.document_tone,
    })
  }
}
