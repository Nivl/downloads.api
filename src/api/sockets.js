'use strict';

var _ = require('underscore'); // todo switch to lodash
var socketIO = require('socket.io');
var io = null;
var messages = {

};

module.exports = {
  listen: function (server) {
    io = socketIO.listen(server);

    io.sockets.on('connection', function (socket) {
      _.each(messages, function (func) {
        func(socket);
      });
    });
  },

  emitToAll: function (type, value) {
    io.emit(type, value);
  },

  emitAllAndNew: function (type, value, id) {
    this.emitToAll(type, value);
    return this.emitToNew(type, value, id);
  },

  emitToNew: function (type, value, id) {
    if (_.has(messages, id)) {
      return false;
    }

    messages[id] = function (socket) {
      socket.emit(type, value);
    };

    return true;
  },

  stopEmitting: function (id) {
    delete messages[id];
  }
};

