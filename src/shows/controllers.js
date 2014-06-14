'use strict';

var moment = require('moment-timezone');
var _ = require('underscore');

//var log = require('../api/log')(module);
var Show = require('./models').Show;

var tz = moment().tz('America/Los_Angeles');

module.exports = {
  getAll: function (req, res) {
    Show.find({}, function (err, shows) {
      if (err) {
        res.send(500);
      } else {
        res.send(shows);
      }
    });
  },

  getLatestAired: function (req, res) {
    var yesterday = tz.subtract('days', 1).format('dddd').toLowerCase();

    Show.find({day: yesterday}, function (err, users) {
      if (err) {
        res.send(500);
      } else {
        res.send(users);
      }
    });
  },

  getByDay: function (req, res) {
    // TODO: put days in a config file to avoid duplicate (models.js)
    var day = req.params.day.toLowerCase();
    var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (_.contains(days, day) === false) {
      res.send(400);
    }

    Show.find({day: day}, function (err, shows) {
      if (err) {
        res.send(500);
      } else {
        res.send(shows);
      }
    });
  },

  addShow: function (req, res) {
    var show = new Show();
    show.title = req.body.title;
    show.downloadLink = req.body.downloadLink;
    show.wikipedia = req.body.wikipedia;
    show.returnDate = req.body.returnDate;
    show.isCompleted = req.body.isCompleted;
    show.isCancelled = req.body.isCancelled;
    show.markedForDeletionDate = req.body.markedForDeletionDate;

    show.save(function (err) {
      if (err) {
        res.send(400, err);
      } else {
        res.send(201, show);
      }
    });
  },

  updateShow: function (req, res) {
    res.send(501);
  }

};