'use strict';

const router = require('express').Router();
const request = require('request');
const User = require('../model/user');
const handlebars = require('handlebars');
const fs = require('fs');
let user_id;
let playlist_id;
let access_token;

router.get('/playlist', (req, res) => {
  // ERROR HANDLING IF NO PLAYLIST
  request({
    url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}`,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + access_token
    }
  }, (error, response, body) => {
    if (error) {
      console.log(error);
    } else {
      console.log(response.statusCode, body);
      res.send(body);
    }
  });
});

router.post('/create/:id', (req, res) => {

  let playlistName = req.headers.name;
  access_token = req.headers.token;
  user_id = req.params.id;



  request({
    url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + access_token,
      'Content-Type': 'application/json'
    },
    json: {
      name: playlistName,
      public: false
    }
  }, (err, response, body) => {

    let source = fs.readFileSync(__dirname + '/../public/webPlayer.html','utf8');
    let template = Handlebars.compile(source);
    let data = {"playlist_id":body.id}
    let result = template(data);

    playlist_id = body.id;
    if (!body.error && res.statusCode === 200) {
      // return res.json({Message: 'Playlist Created!'});
      return res.redirect('/webHelper');
    }
    else {
      res.json('error', body.error);
    }
  });
});

router.post('/add/:track', (req, res) => {

  let track = req.params.track;

  request({
    url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks`,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + access_token,
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
      res.json('error', body.error);
    }
  });
});

module.exports = router;
