'use strict';
const chai = require('chai');
const chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
const mongoose = require('mongoose');
const expect = chai.expect;
const request = chai.request;


const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const access_token = process.env.ACCESS_TOKEN;

const createPL = require('../route/manage-playlist.js');
const userAuth = require('../route/user-auth.js');
const Manager = require('../model/manager');
const Session = require('../model/session');

const dbPort = process.env.MONGOLAB_URI;
process.env.MONGOLAB_URI = 'mongodb://localhost/test';

require('../server.js');

describe('playlist routes', () => {

  let token;
  let manager;
  let playlistId;

  before((done) => {
    request('localhost:8888')
    .post('/signup')
    .send({username:'test', password:'test'})
    .end((err, res) => {
      token = res.body.token;
      done();
    });
  });

  before((done) => {
    let testManager = new Manager({username: '1216797299', accessToken: access_token, refreshToken: 'test', tokenExpires: Date.now() + 100000});
    let testSession = new Session({manager_id: '1216797299'});
    testManager.save((err, data) => {
      if (err) console.log(err);
      manager = data;
      testSession.save((err) => {
        if (err) console.log(err);
        done();
      });
    });
  });

  after((done) => {
    process.env.MONGOLAB_URI = dbPort;
    mongoose.connection.db.dropDatabase(() => {
      done();
    });
  });

  it('should create a playlist', (done) => {
    request('localhost:8888')
    .post('/create/test')
    .set('username', manager.username)
    .set('token', token)
    .end((err,res) => {
      expect(err).to.eql(null);
      expect(res.body.Message).to.eql('Playlist Created!');
      done();
    });
  });

  it('should get playlist', (done) => {
    request('localhost:8888')
    .get('/playlist')
    .set('token', token)
    .set('username', manager.username)
    .end((err,res) => {
      expect(err).to.eql(null);
      expect(res.body.Message).to.eql('Requested Playlist');
      done();
    });
  });

  it('should add a track', (done) => {
    request('localhost:8888')
    .post('/add/spotify:track:33vzOPcd9FRirYGlCu32x4')
    .set('token', token)
    .set('username', manager.username)
    .end((err,res) => {
      expect(err).to.eql(null);
      expect(res.body.Message).to.eql('Track added!');
      done();
    });
  });

  it('should delete a track', (done) => {
    request('localhost:8888')
    .delete('/delete/spotify:track:33vzOPcd9FRirYGlCu32x4')
    .set('token', token)
    .set('username', manager.username)
    .end((err,res) => {
      console.log(err);
      expect(err).to.eql(null);
      expect(res.body.Message).to.eql('Track deleted!');
      done();
    });
  });
});
