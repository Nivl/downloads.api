'use strict';

var request = require('request');
var _ = require('underscore');
var xml2js = require('xml2js');
var TVRage = require('tvragejson');

var log = require('../api/log')(module);
var Show = require('./models').Show;

function waitCallbacks(nbCallbacks, res, data) {
  if (nbCallbacks === 0) {
    res.send(200, data);
  }
}

function getTvDbInfo(imdbId, callback) {
  var tbDbUrl = 'http://thetvdb.com/api/GetSeriesByRemoteID.php?imdbid=' + imdbId;
  request(tbDbUrl, function(error, response, body) {
    if (error) {
      log.error('TVDB error:', error);
    } else {
      var parser = new xml2js.Parser({explicitArray: false});

      parser.parseString(body, function (err, result) {
        if (err) {
          log.error('TVDB error:', err);
        } else {
          callback({synopsis: result.Data.Series.Overview});
        }
      });
    }
  });
}

function getTvRageInfo(tvRageId, callback) {
  var tvRageUrl = 'http://services.tvrage.com/tools/quickinfo.php?sid=' + tvRageId + '&exact=1';

  console.log('TV Rage start');
  request(tvRageUrl, function(error, response, body) {
    console.log('TV Rage responded');
    var out = {};

    if (error) {
      log.error('TV Rage error:', error);
    } else {
      var list = body.split('\n');
      list.splice(0, 1);
      var nbElement = list.length;

      for (var i = 0; i < nbElement; i += 1) {
        var tmp;
        tmp = list[i].split('@');

        if (tmp.length > 1) {
          var key = tmp[0];
          var value = tmp[1];
          var date = value.split('^');

          if (date.length > 1) {
            out[key] = date;
          } else {
            out[key] = value;
          }
        }
      }
    }
    callback(out);
  });
}

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
    var show = new Show(req.body);

    show.save(function (err) {
      if (err) {
        console.log(err);
        res.send(400, err);
      } else {
        res.send(201, show);
      }
    });
  },

  updateShow: function (req, res) {
    var id = req.params.id;

    Show.findById(id, function (err, show) {
      if (err) {
        res.send(400);
      } else {
        show.merge(req.body);

        show.save(function (err) {
          if (err) {
            res.send(400, err);
          } else {
            res.send(200, show);
          }
        });
      }
    });
  },

  removeShow: function (req, res) {
    var id = req.params.id;

    Show.findById(id, function (err, show) {
      if (err) {
        res.send(500);
      } else {
        show.remove(function (err) {
          if (err) {
            res.send(500);
          } else {
            res.send(200);
          }
        });
      }
    });
  },

  fetchInfo: function (req, res) {
    if (req.body.ids) {
      var imdbId = req.body.ids.imdbId;
      var tvRageId = req.body.ids.tvrageId;
      var callbacks = 0;
      var out = {};

      callbacks += 1;
      if (tvRageId && tvRageId > 0) {
        getTvRageInfo(tvRageId, function (data) {
          callbacks -= 1;
          out = _.extend(data, out);
          waitCallbacks(callbacks, res, out);
        });
      } else {
        // TODO: Return the id to the webapp
        TVRage.search(req.body.title, function(response) {
          getTvRageInfo(response.Results.show[0].showid, function (data) {
            callbacks -= 1;
            out = _.extend(data, out);
            waitCallbacks(callbacks, res, out);
          });
        });
      }

      if (imdbId && imdbId.length > 0) {
        callbacks += 1;
        getTvDbInfo(imdbId, function (data) {
          callbacks -= 1;
          out = _.extend(data, out);
          waitCallbacks(callbacks, res, out);
        });
      }
    } else {
      res.send(400, {});
    }
  }
};