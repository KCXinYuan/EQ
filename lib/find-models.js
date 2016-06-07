'use strict';

const Manager = require('../model/manager');
const Session = require('../model/session');

module.exports = function(req, res, next) {

  let user_id = req.headers.username;

  Manager.findOne({username: user_id}, (err, manager) => {
    if (err) return res.send('Cannot find manager.');
    res.manager = manager;

    Session.findOne({manager_id: user_id}, (err, session) => {
      if (err) return res.send('Cannot find session.');
      res.session = session;
      next();
    });
  });

};
