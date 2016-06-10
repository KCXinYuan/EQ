'use strict';

const User = require('../model/user');
const Manager = require('../model/manager');

module.exports = function(req, res, next) {

  if (!res.user) {
    Manager.findOne({username: res.manager.username}, (err, manager) => {

      if (err) return next(err);
      else if(res.manager.signInTime + 3600000 <= Date.now()) {

        Manager.findOneAndUpdate({username: manager.username}, {$set: {vetoes: 0, signInTime: Date.now()}}, (err) => {
          if (err) return next(err);
          return next();
        });
      } else return next();
    });
  } else {

    User.findOne({username: res.user.username}, (err, user) => {
      if (err) return next(err);
      else if(res.user.signInTime + 3600000 <= Date.now()) {
        
        User.findOneAndUpdate({username: user.username}, {$set: {vetoes: 0, signInTime: Date.now()}}, (err) => {
          if (err) return next(err);
          return next();
        });
      } else return next();
    });
  }
};
