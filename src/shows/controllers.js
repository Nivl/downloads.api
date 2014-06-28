'use strict';

var request = require('request');
var _ = require('underscore');
var xml2js = require('xml2js');
var TVRage = require('tvragejson');

var log = require('../api/log')(module);
var Show = require('./models').Show;

function getTvRageInfo(tvRageId, callback) {
  var tvRageUrl = 'http://services.tvrage.com/tools/quickinfo.php?sid=' + tvRageId + '&exact=1';

  request(tvRageUrl, function(error, response, body) {
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

  fetchTvDb: function (req, res) {
    if (req.body.ids) {
      var imdbId = req.body.ids.imdbId;

      if (imdbId && imdbId.length > 0) {
        var tbDbUrl = 'http://thetvdb.com/api/GetSeriesByRemoteID.php?imdbid=' + imdbId;

        request(tbDbUrl, function (error, response, body) {
          if (error) {
            log.error('TVDB error:', error);
            res.send(400, {});
          } else {
            var parser = new xml2js.Parser({explicitArray: false});

            parser.parseString(body, function (err, result) {
              if (err) {
                log.error('TVDB error:', err);
                res.send(400, {});
              } else {
                res.send(200, result.Data.Series);
              }
            });
          }
        });
      } else {
        res.send(400, {});
      }
    } else {
      res.send(400, {});
    }
  },

  fetchTvRage: function (req, res) {
    if (req.body.ids) {
      var tvRageId = req.body.ids.tvrageId;

      if (tvRageId) {
        getTvRageInfo(tvRageId, function (data) {
          var code = (_.isEmpty(data)) ? (400) : (200);
          res.send(code, data);
        });
      } else if (req.body.title || req.body.alternateTitle) {
        var title = req.body.alternateTitle || req.body.title;

        TVRage.search(title, function(response) {
          getTvRageInfo(response.Results.show[0].showid, function (data) {
            if (_.isEmpty(data)) {
              res.send(400, data);
            } else {
              data.id = response.Results.show[0].showid;
              res.send(200, data);
            }
          });
        });
      } else {
        res.send(400, {});
      }
    } else {
      res.send(400, {});
    }
  }
};


