'use strict';

const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Manager = require('../model/manager');
const secret = process.env.SECRET || 'testPass';

module.exports = function(req, res, next) {

  let token = req.headers.token || req.body.token;

  Manager.findOne({username: req.headers.username}, (err, manager) => {

    if (err) return next(err);
    else if (manager) return next();
    else {
      if (!token) return next(new Error('No token provided'));

      try {
        token = jwt.verify(token, secret);
      } catch(err) {
        return next(new Error('Invalid token'));
      }

      User.findOne({_id: token}, (err, user) => {
        if (err) return next(new Error('Cannot find user'));
        req.user = user;
        next();
      });
    }
  });
};
