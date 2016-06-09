'use strict';

const router = require('express').Router();
const Session = require('../model/session');
const findModels = require('../lib/find-models');
const checkToken = require('../lib/check-token');
const jwtAuth = require('../lib/jwt-auth');
const request = require('superagent');
const User = require('../model/user');
const Manager = require('../model/manager');
const refreshVetoes = require('../lib/refresh-vetoes');


let access_token;
let playlist_id;
let manager_id;

router.get('/playlist', findModels, checkToken, jwtAuth, (req, res) => {

  playlist_id = res.session.playlist_id;
  manager_id = res.manager.username;
  access_token = res.manager.accessToken;

  let plPromise = new Promise((resolve,reject) => {
    request
      .get(`https://api.spotify.com/v1/users/${manager_id}/playlists/${playlist_id}`)
      .set('Authorization', 'Bearer ' + access_token)
      .end((err, res) => {

        if (err) return reject({message: err});

        let playlistArr =res.body.tracks.items;
        resolve (playlistArr.map(function(item, index) {

          if (item.track.artists.length > 1) {
            return {
              postion: index,
              id: item.track.id,
              name: item.track.name,
              artistOne:item.track.artists[0].name,
              artistTwo:item.track.artists[1].name
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

router.post('/create/:name', findModels, checkToken, (req, res, next) => {

  access_token = res.manager.accessToken;
  manager_id = res.manager.username;
  let playlistName = req.params.name;

  if (res.user) return next(new Error('User not allowed to make new playlist'));

  request
  .post(`https://api.spotify.com/v1/users/${manager_id}/playlists`)
  .send({name:playlistName, public:false})
  .set('Authorization', `Bearer ${access_token}`)
  .set('Accept', 'application/json')
  .end((err, response) => {
    playlist_id = response.body.id;

    if (err) return next(err);
    else {
      Session.findOneAndUpdate({manager_id}, {$set: {playlist_id}}, (err) => {
        if (err) return next(err);
        res.json({Message: 'Playlist Created!'});
      });
    }
  });
});

router.post('/add/:track', findModels, checkToken, jwtAuth, (req, res, next) => {

  access_token = res.manager.accessToken;
  let track = req.params.track;

  if (!res.user && (res.manager.tracks.indexOf(track) !== -1) ) {
    return res.json({Message: 'Song already on playlist.'});

  } else if (res.user && res.user.tracks.indexOf(track) !== -1) {
    return res.json({Message: 'Song already on playlist.'});
  }
   else {

    request
      .post(`https://api.spotify.com/v1/users/${res.session.manager_id}/playlists/${res.session.playlist_id}/tracks`)
      .send({uris: [`${track}`]})
      .set('Authorization', `Bearer ${access_token}`)
      .set('Accept', 'application/json')
      .end((err) => {
        if (err) {
          return next(err);
        } else if (!res.user) {
          Manager.findOne({username: res.manager.username}, (err, manager) => {
            if (err) return next(err);

            let managerTrackArray = manager.tracks;
            managerTrackArray.push(track);
            Manager.findOneAndUpdate({username: manager.username}, {$set: {tracks: managerTrackArray}}, (err) => {
              if (err) return next(new Error('Cannot update user tracks'));
              return res.json({Message:'Track added!'});
            });
          });
        } else {

          User.findOne({username: res.user.username}, (err, user) => {
            let userTrackArray = user.tracks;
            userTrackArray.push(track);
            User.findOneAndUpdate({username: user.username}, {$set: {tracks: userTrackArray}}, (err) => {
              if (err) return next(new Error('Cannot update user tracks'));
              res.json({Message:'Track added!'});
            });
          });
        }
      });
  }
});

router.delete('/delete/:track', findModels, checkToken, jwtAuth, refreshVetoes, (req, res, next) => {

  let manager = res.manager;
  let track = req.params.track;
  let manager_id = manager.username;
  playlist_id = res.session.playlist_id;
  access_token = manager.accessToken;

  if (!res.user) {
    Manager.findOne({username: res.manager.username}, (err, manager) => {
      if (err) return next(new Error('Cannot find manager.'));

      else if (manager.vetoes === res.session.users.length + 1) return res.json({Message: 'Out of vetoes'});
      else {
        let newManagerVetoCount = manager.vetoes + 1;
        Manager.findOneAndUpdate({username: manager.username}, {$set: {vetoes: newManagerVetoCount}}, (err) => {
          if (err) return next(new Error('Cannot update user vetoes'));
          return;
        });
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
            if (err) return next(err);
            return res.json({Message:'Track deleted!'});
          });
      }
    });
  } else {

    User.findOne({username: res.user.username}, (err, user) => {

      if (user.vetoes === res.session.users.length + 1) {

        res.json({Message: 'Out of vetoes'});

      } else {
        let newUserVetoCount = user.vetoes + 1;

        User.findOneAndUpdate({username: user.username}, {$set: {vetoes: newUserVetoCount}}, (err) => {
          if (err) return next(new Error('Cannot update user tracks'));
        });

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
            if (err) return next(err);
            res.json({Message:'Track deleted!'});
          });
      }
    });
  }
});

router.use((err, req, res, next) => {
  res.json(err.message);
  next(err);
});

module.exports = router;
