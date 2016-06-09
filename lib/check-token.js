'use strict';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const request = require('request');
const Manager = require('../model/manager');
let user_id;

module.exports = function(req, res, next) {

  let time = Date.now();
  let manager = res.manager;
  user_id = manager.username;

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
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
    console.log('request new token');
    console.log('status', response.body);
    if (!err && response.statusCode === 200) {
      let expires_in = body.expires_in * 1000;
      let access_token = body.access_token;

      Manager.findOneAndUpdate({username: user_id}, { $set: {accessToken: access_token, tokenExpires: expires_in + Date.now()}}, {new: true}, (err, manager) => {
        console.log('manager from getnewtoken', manager);
        if (err) throw err;
        res.manager = manager;
        next();
      });
    }
  }
};
