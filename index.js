#!/usr/bin/env nodemon
'use strict';

var projectConfig = require('./config').current;
var project = require('./package.json');

module.exports = {
  startServer: function (production) {
    var server = require('./src/api/server').create(production);
    var port = process.env.PORT || projectConfig.http.port;
    var hostname = projectConfig.http.hostname;

    server.listen(port, hostname, function () {
      console.log('%s#%s listening at %s:%s',
                  project.name, project.version, hostname, port);
    });
  }
};


var main = function () {
    module.exports.startServer(true);
  };

if (require.main === module) {
  main();
}
