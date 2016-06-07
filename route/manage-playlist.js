'use strict';

const router = require('express').Router();
const request = require('request');
const Session = require('../model/session');
const findUser = require('../lib/find-user');
const checkToken = require('../lib/check-token');
const jwtAuth = require('../lib/jwt-auth');
const requestAgent = require('superagent');
let access_token;
let playlist_id;
let manager_id;

router.use('*', findUser);
router.use('*', checkToken);
router.use('*', jwtAuth);

router.get('/playlist', (req, res, next) => {

  playlist_id = res.session.playlist_id;
  manager_id = res.manager.username;
  access_token = res.manager.accessToken;
  let pTracks;
  request
  .get(`https://api.spotify.com/v1/users/${manager_id}/playlists/${playlist_id}`)
  .set('Authorization', `Bearer ${access_token}`)
  .end((err, res) => {
    console.log(res.body.tracks.items[0]);
    if (err) return next(err);
    pTracks = res.body.tracks.items;
  });
  res.json({tracks: pTracks});
});

router.post('/create/:name', (req, res, next) => {

  access_token = res.manager.accessToken;
  manager_id = res.manager.username;
  let playlistName = req.params.name;

  request({
    url: `https://api.spotify.com/v1/users/${manager_id}/playlists`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    json: {
      name: playlistName,
      public: false
    }
  }, (err, response, body) => {
    let playlist_id = body.id;
    if (!body.error && res.statusCode === 200) {
      Session.findOneAndUpdate({manager_id}, { $set: {playlist_id}}, (err) => {
        if (err) next(err);
      });
      return res.json({Message: 'Playlist Created!'});
    }
    else {
      next(body.error);
    }
  });
});

router.post('/add/:track', (req, res, next) => {

  access_token = res.manager.accessToken;
  let track = req.params.track;

  request({
    url: `https://api.spotify.com/v1/users/${res.session.manager_id}/playlists/${res.session.playlist_id}/tracks`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    json: {
      uris: [`${track}`]
    }
  }, (err, response, body) => {
    console.log(body);
    if (!body.error && res.statusCode === 200) {
      return res.json({Message: 'Track added!'});
    }
    else {
      next(body.error);
    }
  });
});

router.delete('/delete/:track', (req, res, next) => {
  let manager = res.manager;
  let track = req.params.track;
  let manager_id = manager.username;
  let playlist_id = res.session.playlist_id;
  access_token = manager.accessToken;
  requestAgent
    .del(`https://api.spotify.com/v1/users/${manager_id}/playlists/${playlist_id}/tracks`)
    .send({
      'tracks' : [
        {
          'uri' : `${track}`
        }
      ]
    })
    .set(
      'Authorization', `Bearer ${access_token}`
    )
    .set(
      'Accept', 'application/json'
    )
    .end((err) => {
      if(err) return err;
    });
  res.send('ending');
});

module.exports = router;
