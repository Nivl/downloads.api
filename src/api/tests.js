'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Disable TLS cert checking

var mongoose = require('mongoose');
var assert = require('assert');

// Start Server
before(function (done) {
  require('../../index').startServer(false);
  done();
});

// Remove database
before(function (done) {
  mongoose.connection.on('open', function () {
    mongoose.connection.db.dropDatabase(function (err) {
      assert.ifError(err);
      done();
    });
  });
});
