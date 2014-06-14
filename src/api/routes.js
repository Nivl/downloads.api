'use strict';

var showRoutes = require('../shows/routes');

module.exports = {
  apply: function (server) {
    server.use('/', showRoutes);

    return server;
  }
};
