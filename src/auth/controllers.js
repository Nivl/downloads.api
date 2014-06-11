'use strict';

//var log = require('../api/log')(module);
var User = require('./models').User;
var Client = require('./models').Client;

module.exports = {
  userList: function (req, res) {
    User.find(function (err, users) {
      if (err) {
        res.send(500);
      } else {
        res.send(users);
      }
    });
  },

  userGet: function (req, res) {
    var id = req.params.id;

    User.findById(id, function (err, user) {
      if (err || user === null) {
        res.send(404, {});
      } else {
        res.send(200, user);
      }
    });
  },

  userAdd: function (req, res) {
    var user = new User();
    user.lastName = req.body.lastName;
    user.firstName = req.body.firstName;
    user.email = req.body.email;
    user.password = req.body.password;

    user.save(function (err) {
      if (err) {
        res.send(400, err);
      } else {
        res.send(201, user);
      }
    });
  },

  clientAdd: function (req, res) {
    var client = new Client();
    client.name = req.body.name;

    client.save(function (err) {
      if (err) {
        res.send(400, err);
      } else {
        res.send(201, client);
      }
    });
  },
};
