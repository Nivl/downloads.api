'use strict';

var supertest = require('supertest');
var assert = require('assert');

var serverConfig = require('../../config');
var User = require('./models').User;

var protocol = (serverConfig.current.useSSL) ? ('https') : ('http');
var api = supertest(protocol + '://' + serverConfig.current.hostname + ':' +  serverConfig.current.port);


describe('Module: Auth', function () {
  var _user = null;
  var _userData = null;
  var _client = null;
  var _token = null;

  describe('Clients', function () {
    var clientData = {'name': 'test-client'};

    it('should create a client', function (done) {
      api.post('/auth/clients/add/')
         .send(clientData)
         .expect(201)
         .end(function (err, res) {
          assert.ifError(err);
          assert.notStrictEqual(typeof res.body, 'undefined');
          assert.notStrictEqual(typeof res.body.name, 'undefined');
          assert.equal(res.body.name, clientData.name);

          _client = res.body;
          done();
        });
    });

    it('should fail on duplicate client', function () {
      api.post('/auth/clients/add/')
         .send(clientData)
         .expect(400);
    });
  });

  describe('User add', function () {
    _userData = {
      lastName: 'Laplanche',
      firstName: 'Melvin',
      email: 'melvin@melvin.re',
      password: 'qwerty'
    };

    it('should add a user, and return it', function (done) {
      api.post('/auth/users/add/')
         .send(_userData)
         .expect(201)
         .end(function (err, res) {
          // Check the request
          assert.ifError(err);

          // Check the returned data
          assert.notStrictEqual(typeof res.body, 'undefined');
          assert.notStrictEqual(typeof res.body._id, 'undefined');
          assert.notEqual(res.body._id.length, 0);

          // Check the data have not been altered
          assert.equal(res.body.lastName, _userData.lastName);
          assert.equal(res.body.firstName, _userData.firstName);
          assert.equal(res.body.email, _userData.email);

          User.findOne({email: _userData.email}, function (err, user) {
            assert.ifError(err);

            if (user.checkPassword(_userData.password) === false) {
              assert.notStrictEqual(user, null);
            }

            _user = res.body;
            done();
          });
        });
    });

    it('should fail on duplicate user', function () {
      api.post('/auth/users/add/')
         .send(_userData)
         .expect(400);
    });
  });

  describe('Tokens', function () {
    /*jshint camelcase: false*/

    before(function (done) {
      assert.notStrictEqual(_user, null);
      assert.notStrictEqual(_client, null);
      done();
    });

    it('should generate a token', function (done) {
      var tokenData = {
        grant_type: 'password',
        client_id: _client.key,
        client_secret: _client.secret,
        username: _userData.email,
        password: _userData.password
      };

      api.post('/auth/access/token/')
         .send(tokenData)
         .expect(200)
         .end(function (err, res) {
          assert.ifError(err);
          assert.notStrictEqual(typeof res.body, 'undefined');
          _token = res.body;
          done();
        });
    });

    it('should regenerate a token', function (done) {
      assert.notStrictEqual(_token, null);

      var tokenData = {
        grant_type: 'refresh_token',
        client_id: _client.key,
        client_secret: _client.secret,
        refresh_token: _token.refresh_token,
      };

      api.post('/auth/access/token/')
         .send(tokenData)
         .expect(200)
         .end(function (err, res) {
          assert.ifError(err);
          assert.notStrictEqual(typeof res.body, 'undefined');
          _token = res.body;
          done();
        });
    });
  });

  describe('Users', function () {
    /*jshint camelcase: false*/
    var accessToken;
    var viewUserURI;

    before(function (done) {
      assert.notStrictEqual(_token, null);
      assert.notStrictEqual(_user, null);

      viewUserURI = '/auth/users/get/' + _user._id + '/';
      accessToken = {
        access_token: _token.access_token,
      };

      done();
    });

    describe('Listing', function () {
      it('Should fail when not connected', function (done) {
        api.get('/auth/users/')
           .expect(401, done);
      });

      it('Should be accessible to allowed users', function (done) {
        api.get('/auth/users/')
           .send(accessToken)
           .expect(200)
           .end(function (err, res) {
            assert.ifError(err);
            assert.notStrictEqual(typeof res.body, 'undefined');
            done();
          });
      });
    });

    describe('View a user', function () {
      it('Should fail when not connected', function () {
        api.get(viewUserURI)
           .expect(401);
      });

      it('Should fail on unexisting user', function () {
        api.get('/auth/users/get/wrong-id/')
           .expect(404);
      });

      it('Should return the user to an allowed user', function (done) {
        api.get(viewUserURI)
           .send(accessToken)
           .expect(200)
           .end(function (err, res) {

            assert.ifError(err);
            assert.notStrictEqual(typeof res.body, 'undefined');
            assert.equal(res.body._id, _user._id);

            done();
          });
      });
    });
  });
});
