'use strict';

var express = require('express');
var mongoose = require('mongoose');
var http = require('http');

var config = require('../../config').current;
var routes = require('./routes');

module.exports = {
  create: function (production) {

    if (production === true) {
      mongoose.connect(config.db.mongo);
    } else {
      mongoose.connect(config.db.mongoTest);
    }

    var app = express();
    app.use(require('body-parser')());
    app.use(require('method-override')());

    app.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
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

    return http.createServer(app);
  }
};
