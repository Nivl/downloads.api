module.exports = {
  dev: {
    useSSL: false,
    http: {
      hostname: '0.0.0.0',
      port: 3000
    },
    security: {
      'tokenLife' : 3600
    },
    db: {
      mongo: 'mongodb://localhost/download',
      mongoTest: 'mongodb://localhost/download-test',
    }
  },

  prod: {
    useSSL: true,
    http: {
      hostname: '0.0.0.0',
      port: 3000
    },
    security: {
      'tokenLife' : 3600
    },
    db: {
      mongo: 'mongodb://localhost/download',
      mongoTest: 'mongodb://localhost/download-test',
    }
  },

  test: {
    useSSL: true,
    http: {
      hostname: '127.0.0.1',
      port: 3000
    },
    security: {
      'tokenLife' : 3600
    },
    db: {
      mongo: 'mongodb://localhost/download',
      mongoTest: 'mongodb://localhost/download-test',
    }
  },

  init: function () {
    'use strict';
    this.current = this.dev;
    return this;
  }
}.init();
