'use strict';

const express = require('express');
const bodyParser = require('body-parser').json();
const basicAuth = require('../lib/basic-auth');
const User = require('../model/user');
const Session = require('../model/session');
const router = module.exports = express.Router();

router.post('/signup', bodyParser, (req, res, next) => {

  if (!req.body.password || !req.body.username) return next(new Error('Please enter a username and password'));

  let newUser = new User(req.body);
  let managerId = req.headers.manager;
  newUser.password = newUser.hashPassword();
  req.body.password = null;

  User.findOne({username: req.body.username}, (err, user) => {
    if (err || user) return next(new Error('Could not create user'));
    newUser.userToken = newUser.generateToken();

    newUser.save((err, user) => {
      if (managerId) {
        if (err) return next(new Error('Could not create user'));
        findAndUpdateSession(managerId, user, next);
        res.json({token: newUser.userToken});
      } else {
        if (err) return next(new Error('Could not create user'));
        res.json({token: newUser.userToken});
      }
    });
  });
});


router.get('/signin', basicAuth, (req, res, next) => {

  let managerId = req.headers.manager;
  let username = req.auth.username;
  let password = req.auth.password;

  User.findOne({username}, (err, user) => {
    if (err || !user || !user.comparePassword(password)) return next(new Error('Validation failure'));
    else if (managerId) findAndUpdateSession(managerId, user, next);
    return res.json({token: user.generateToken()});
  });
});

function findAndUpdateSession(managerId, user, next) {

  Session.findOne({managerId}, (err, session) => {
    let users = session.users;

    if (err || !session) return next(err);
    else if (users.indexOf(user.username) === -1) {
      users.push(user.username);
      Session.findOneAndUpdate({managerId}, {$set: {users}}, (err) => {
        if (err) return next(err);
      });
    }
  });
}

module.exports = router;
