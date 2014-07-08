'use strict';

// TODO use the format (date: message) for the logs

var request = require('request');
var _ = require('underscore'); // todo replace by lodash
var xml2js = require('xml2js');
var TVRage = require('tvragejson');
var schedule = require('node-schedule');
var uuid = require('node-uuid');

var io = require('../api/sockets');
var log = require('../api/log')(module);
var Show = require('./models').Show;

function findWeekIndex(name) {
  var week = {Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7};
  return week[name];
}

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

function updateShowFromTvRage(show, callbackObj) {
  getTvRageInfo(show.ids.tvrageId, function (data) {
    if (_.isEmpty(data)) {
      callbackObj.done();
      log.error('Fail to retrieve ' + show.title + ':', 'Empty data');
    } else {
      if (data.Status) {
        if (data.Status === 'Ended') {
          show.isCompleted = true;
        } else if (data.Status === 'Canceled') {
          show.isCancelled = true;
        }
      }

      if (data.Airtime) {
        var info = data.Airtime.split(' at ');
        show.day = findWeekIndex(info[0]);
      }

      if (data['Next Episode'] && data['Next Episode'][2]) {
        show.nextEpisode = {'title': data['Next Episode'][1], date: data['Next Episode'][2]};
      }

      if (data['Latest Episode'] && data['Latest Episode'][2]) {
        show.latestEpisode = {'title': data['Latest Episode'][1], date: data['Latest Episode'][2]};
      }

      show.save(function (err) {
        if (err) {
          log.error('Fail to update ' + show.title + ':', err);
        }
        callbackObj.done();
      });
    }
  });
}

schedule.scheduleJob('30 * * * *', function () {
  var id = uuid.v4();
  io.emitAllAndNew('maintenance', true, id);

  Show.find({}, function (err, shows) {
    if (err) {
      log.error('Cron failed:', err);
    } else {
      var nbShow = shows.length;

      var callbackObj = {
        nb: nbShow,
        done: function () {
          this.nb -= 1;

          if (this.nb === 0) {
            io.stopEmitting(id);
            io.emitToAll('maintenance', false);
          }
        }
      };

      for (var i = 0; i < nbShow; i += 1) {
        updateShowFromTvRage(shows[i], callbackObj);
      }
    }
  });
});

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

  // Todo avoid duplicate show
  addShow: function (req, res) {
    var show = new Show(req.body);

    show.save(function (err) {
      if (err) {
        res.send(400, err);
      } else {
        io.emitToAll('addShow', show);
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
            io.emitToAll('updateShow', show);
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
        var showData = {
          id: id,
          day: show.day
        };

        show.remove(function (err) {
          if (err) {
            res.send(500);
          } else {
            io.emitToAll('removeShow', showData);
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
        TVRage.search(title, function (err, response) {
          if (err) {
            res.send(400, {});
            log.error('fail');
          } else {
            var showId = response.Results.show[0].showid[0];

            getTvRageInfo(showId, function (data) {
              if (_.isEmpty(data)) {
                res.send(400, data);
              } else {
                data.id = showId;
                res.send(200, data);
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
  }
};


