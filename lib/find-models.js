'use strict';

const Manager = require('../model/manager');
const Session = require('../model/session');
const User = require('../model/user');

module.exports = function(req, res, next) {

  let user_id = req.headers.username;

  if (!user_id) return next(new Error('Please enter a username in the headers'));

  Manager.findOne({username: user_id}, (err, manager) => {

    if (err) return next(err);

    else if (!manager) {
      User.findOne({username: user_id}, (err, user) => {
        if (err) {
          return next(err);
        }
        res.user = user;
      });

      Session.findOne({users: user_id}, (err, session) => {
        if (err) return next(err);
        res.session = session;

        Manager.findOne({username: session.manager_id}, (err, manager) => {
          if (err) {
            return next(err);
          }
          res.manager = manager;
          return next();
        });
      });
    } else {
      res.manager = manager;

      Session.findOne({manager_id: user_id}, (err, session) => {
        if (err) return next(err);
        res.session = session;
        next();
      });
    }
  });

};
