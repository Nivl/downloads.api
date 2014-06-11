'use strict';

var express = require('express');
var authRoutes = require('../auth/routes');

module.exports = {
  apply: function (server) {
    server.use('/', authRoutes);

    return server;
  }
};
