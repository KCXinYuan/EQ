'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const request = require('chai').request;
const mongoose = require('mongoose');
const dbPort = process.env.MONGOLAB_URI;
const Session = require('../model/session');
const Manager = require('../model/manager');
const checkToken = require('../lib/check-token');

process.env.MONGOLAB_URI = 'mongodb://localhost/test_db';
const access_token = process.env.ACCESS_TOKEN;
const refresh_token = process.env.REFRESH_TOKEN;

require('../server');


let req = {};
req.token = access_token;
let res = {};

describe('unit tests', () => {

  before((done) => {
    request('localhost:8888')
    .post('/signup')
    .send({username:'test', password:'test'})
    .end((err) => {
      if (err) throw err;
      done();
    });
  });

  before((done) => {

    let testManager = new Manager({username: '1216797299', accessToken: access_token, refreshToken: refresh_token, tokenExpires: Date.now() + 100000});
    let testSession = new Session({manager_id: '1216797299'});

    testManager.save((err, data) => {
      if (err) throw err;
      res.manager = data;

      testSession.save((err, session) => {
        console.log('session', session)
        if (err) throw err;
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

  describe('check token middleware tests', () => {

    it('should not change the token stored on the manager if it is valid', (done) => {

      checkToken(req, res, () => {
        expect(res.manager.accessToken).to.eql(access_token);
        done();
      });
    });

    it('should request a new token and store it on the manager if the current token is invalid', (done) => {
      Manager.findOneAndUpdate({username: '1216797299'}, {$set: {tokenExpires: Date.now() - 10000}}, {new: true}, (err, manager) => {
        if (err) throw err;
        res.manager = manager;
        console.log('res.manager inside test', res.manager);
        checkToken(req, res, () => {
          expect(res.manager.accessToken).to.not.eql(access_token);
          done();
        });
      });
    });
  });


  describe('check token middleware tests', () => {
  });
});
