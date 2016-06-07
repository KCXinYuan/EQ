'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser').json();
const spotifyAuthRouter = require('./route/spotify-auth');
const playlistRouter = require('./route/manage-playlist');
const userAuth = require('./route/user-routes');

const dbPort = process.env.MONGOLAB_URI || 'mongodb://localhost/dev_db';
mongoose.connect(dbPort);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.use(bodyParser);

app.use('/', userAuth);

app.use('/', spotifyAuthRouter);

app.use('/', playlistRouter);

app.use((err, req, res, next) => {
  res.send('Error: ', err.message);
});

app.all('*', (req, res) => {
  res.status(404).json({Message:'Not Found'});
});

app.listen(8888, () => {
  console.log('Up on 8888');
});
