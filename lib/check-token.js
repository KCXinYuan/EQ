'use strict';

const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET;
const request = require('request');
const Manager = require('../model/manager');
let user_id;
let access_token;

module.exports = function(req, res, next) {

  let time = Date.now();
  let manager = res.manager;
  console.log('manager', manager);
  access_token = manager.accessToken;
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
  console.log('time', time);
  console.log('token expires', manager.tokenExpires);
  if (manager.tokenExpires < time) {
    request.post(authOptions, getNewToken);
  }
  next();
};


function getNewToken(err, res, body) {
  console.log('POSTING TO SPOTIFY');
  if (!err && res.statusCode === 200) {
    let expires_in = body.expires_in * 1000;
    let access_token = body.access_token;
    let refresh_token;
    refresh_token ? body.refresh_token : null;
    console.log('successfully requested a new token from spotify');
    Manager.findOneAndUpdate({username: user_id}, { $set: {accessToken: access_token, refreshToken: refresh_token, tokenExpires: expires_in + Date.now()}}, (err) => {
      if (err) console.log(err);
    });
    console.log('response from spotify', body);
  }
}
