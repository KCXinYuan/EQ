'use strict';

const request = require('request');

const Manager = require('../model/manager');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

let username;

module.exports = function(req, res, next) {

  let time = Date.now();
  let manager = res.manager;
  username = manager.username;

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: manager.refreshToken
    },
    json: true
  };

  if (manager.tokenExpires < time) {
    request.post(authOptions, getNewToken);
  } else next();

  function getNewToken(err, response, body) {
    if (!err && response.statusCode === 200) {
      let tokenExpires = (body.expires_in * 1000) + Date.now();
      let accessToken = body.access_token;

      Manager.findOneAndUpdate({username}, {$set: {accessToken, tokenExpires}}, {new: true}, (err, manager) => {
        if (err) next(err);
        res.manager = manager;

        next();
      });
    }
  }
};
