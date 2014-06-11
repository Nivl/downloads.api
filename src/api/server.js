'use strict';

var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var fs = require('fs');

var config = require('../../config').current;
var routes = require('./routes');

require('../auth/libs/auth');

module.exports = {
  create: function (production) {

    if (production === true) {
      mongoose.connect(config.db.mongo);
    } else {
      mongoose.connect(config.db.mongoTest);
    }

    var app = express();
    app.use(passport.initialize());
    app.use(require('body-parser')());
    app.use(require('method-override')());

    app.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With');
      next();
    });

    routes.apply(app);

    app.use(function (req, res) {
      res.status(404);
      res.send({ error: 'Not found' });
    });

    app.use(function (err, req, res) {
      res.status(err.status || 500);
      res.send({ error: err.message });
    });

    if (config.useSSL) {
      var https = require('https');
      var credentials = {
        key: fs.readFileSync('http/certificates/api.key', 'utf8'),
        cert: fs.readFileSync('http/certificates/api.crt', 'utf8')
      };

      return https.createServer(credentials, app);
    } else {
      var http = require('http');

      return http.createServer(app);
    }
  }
};
