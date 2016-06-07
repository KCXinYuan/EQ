'use strict';

const router = require('express').Router();
const Session = require('../model/session');
const findModels = require('../lib/find-models');
const checkToken = require('../lib/check-token');
const jwtAuth = require('../lib/jwt-auth');
const request = require('superagent');
let access_token;
let playlist_id;
let manager_id;

router.get('/playlist', findModels, checkToken, jwtAuth, (req, res) => {

  playlist_id = res.session.playlist_id;
  manager_id = res.manager.username;
  access_token = res.manager.accessToken;
  let pTracks = [];

  let plPromise = new Promise((resolve,reject) => {
    request
      .get(`https://api.spotify.com/v1/users/${manager_id}/playlists/${playlist_id}`)
      .set('Authorization', 'Bearer ' + access_token)
      .end((err, res) => {

        if (err) return reject({message: err});

        let playlistArr =res.body.tracks.items;
        resolve (pTracks = playlistArr.map(function(item, index) {

          if(item.track.artists.length > 1) {
            return {
              postion: index,
              id: item.track.id,
              name: item.track.name,
              artistOne:item.track.artists[0].name,
              artistTwo:item.track.artists[1].name,
              addedBy:item.added_by.id
            };

          } else {
            return {
              position: index,
              id: item.track.id,
              name: item.track.name,
              artist: item.track.artists[0].name,
              addedBy: item.added_by.id
            };
          }
        }));
      });
  });

  plPromise.then((plData) => {
    res.json({playlist:plData});
  }, (err) => {
    res.json(err);
  });
});

router.post('/create/:name', findModels, checkToken, jwtAuth, (req, res, next) => {

  access_token = res.manager.accessToken;
  manager_id = res.manager.username;
  let playlistName = req.params.name;

  request
  .post(`https://api.spotify.com/v1/users/${manager_id}/playlists`)
  .send({name:playlistName, public:false})
  .set('Authorization', `Bearer ${access_token}`)
  .set('Accept', 'application/json')
  .end((err,res) => {

    if(err) next(err);
    let playlist_id = res.body.id;

    if(!err) {
      Session.findOneAndUpdate({manager_id}, {$set: {playlist_id}}, (err) => {
        if (err) next(err);
      });
    }

  });
  res.json({Message:'Playlist Created!'});
});

router.post('/add/:track', findModels, checkToken, jwtAuth, (req, res, next) => {

  access_token = res.manager.accessToken;
  let track = req.params.track;

  request
    .post(`https://api.spotify.com/v1/users/${res.session.manager_id}/playlists/${res.session.playlist_id}/tracks`)
    .send({uris: [`${track}`]})
    .set('Authorization', `Bearer ${access_token}`)
    .set('Accept', 'application/json')
    .end((err) => {
      if(err) return next(err);
      res.json({Message:'Track added!'});
    });
});

router.delete('/delete/:track', findModels, checkToken, jwtAuth, (req, res, next) => {

  let manager = res.manager;
  let track = req.params.track;
  let manager_id = manager.username;
  let playlist_id = res.session.playlist_id;
  access_token = manager.accessToken;

  request
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
      if(err) next(err);
      res.json({Message:'Track deleted!'});
    });
});

module.exports = router;
