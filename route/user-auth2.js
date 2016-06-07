'use strict';

const express = require('express');
const router = express.Router();
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const session = require('express-session');

const appKey = process.env.CLIENT_ID; // Your client id
const appSecret = process.env.CLIENT_SECRET; // Your secret

const User = require('../model/user');

router.use(cookieParser());
router.use(bodyParser());
router.use(methodOverride());
router.use(session({ secret: 'keyboard cat' }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne( {user_id: id}, function(err, user) {
    done(err, user);
  });
});

passport.use(new SpotifyStrategy({
  clientID:   appKey,
  clientSecret: appSecret,
  callbackURL: 'http://localhost:8888/callback'
},
  (accessToken, refreshToken, profile, done) => {
    console.log('access', accessToken);
    User.findOne({ user_id: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

router.get('/', function(req, res){
  res.render('index.html', { user: req.user });
});

router.get('/login', function(req, res){
  res.render('login.html', { user: req.user });
});

router.get('/auth/spotify', passport.authenticate('spotify', {scope: ['user-read-email', 'playlist-modify-private'], showDialog: true}), () => {
  // nothing to see here
});

router.get('/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) { return next(); }
//   res.redirect('/login');
// }

module.exports = router;
