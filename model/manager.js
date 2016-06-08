'use strict';

const mongoose = require('mongoose');

const Manager = new mongoose.Schema({
  username: {type: String, required: true},
  accessToken: {type: String, required: true},
  refreshToken: {type: String, required: true},
  tokenExpires: {type: Number, required: true},
  tracks: {type: Array},
  vetoes: {type: Number, required: true, default: 0}
});

module.exports = mongoose.model('manager', Manager);
