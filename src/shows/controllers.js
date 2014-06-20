'use strict';

//var log = require('../api/log')(module);
var Show = require('./models').Show;

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

  addShow: function (req, res) {
    var show = new Show(req.body.formData);

    show.save(function (err) {
      if (err) {
        res.send(400, err);
      } else {
        res.send(201, show);
      }
    });
  },

  updateShow: function (req, res) {
    var id = req.params.id;

    // TODO: might be useless
    if (req.body.formData && req.body.formData.day) {
      req.body.formData.day = parseInt(req.body.formData.day);
    }

    Show.update({_id: id}, {$set: req.body.formData}, function (err) {
      if (err) {
        res.send(400, err);
      } else {
        res.send(200);
      }
    });
  }

};