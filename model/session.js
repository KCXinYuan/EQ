'use strict';

const mongoose = require('mongoose');

const Session = new mongoose.Schema({
  managerId: {type: String, required: true},
  playlistId: {type: String},
  users: {type: Array}
});

module.exports = mongoose.model('session', Session);
