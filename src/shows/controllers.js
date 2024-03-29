'use strict';

// TODO use the format (date: message) for the logs
// Add an error message in the responses

var request = require('request');
var _ = require('underscore'); // todo replace by lodash
var xml2js = require('xml2js');
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
  var type = (typeof tvRageId === 'string') ? 'show' : 'sid';
  var tvRageUrl = 'http://services.tvrage.com/tools/quickinfo.php?' + type + '=' + tvRageId;

  request(tvRageUrl, function(error, response, body) {
    var out = {};

    if (error) {
      log.error('TV Rage error:', error);
    } else {
      var list = body.split('\n');
      var nbElement = list.length;

      for (var i = 0; i < nbElement; i += 1) {
        if (i === 0) {
          list[0] = list[0].substr(5);
        }

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

function tvRageEmptyData(show, key, callbackObj) {
  if (show.totalUpdateFailure >= 5 && key === show.ids.tvrage) { // Called when a show has no tvRage ID
    log.info('[' + show.ids.tvrage + '] Failled ' + show.totalUpdateFailure + ' times  force reload: ', show.title);
    updateShowFromTvRage(show, callbackObj, show.title);
  } else {
    show.totalUpdateFailure += 1;

    show.save(function() {
      callbackObj.done();
    });
    log.error('[' + show.ids.tvrage + '] Fail ' + show.totalUpdateFailure + ' times to retrieve ' + show.title + ':', 'Empty data');
  }
}

/**
 * Update a show
 *
 * show : show to update
 * callBackObj: Object to callback
 * id: Optional: data to fetch (int for ID, string fot a title). Use ids.tvrage if not provided
 */
function updateShowFromTvRage(show, callbackObj, id) {
  var key = (typeof id === 'undefined') ? (show.ids.tvrage) : (id);

  getTvRageInfo(key, function (data) {
    if (_.isEmpty(data)) {
      tvRageEmptyData(show, key, callbackObj);
    } else {
      show.totalUpdateFailure = 0;

      show.ids.tvrage = parseInt(data['Show ID'], 10);

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

      if (show.day === null) {
        show.day = 8;
      }

      if (data['Next Episode'] && data['Next Episode'][2]) {
        show.nextEpisode = {'title': data['Next Episode'][1], date: data['Next Episode'][2]};
      } else {
        show.nextEpisode = null;
      }

      if (data['Latest Episode'] && data['Latest Episode'][2]) {
        show.latestEpisode = {'title': data['Latest Episode'][1], date: data['Latest Episode'][2]};
      } else {
        show.latestEpisode = null;
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

function reloadAllShows() {
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
}


schedule.scheduleJob('30 */2 * * *', reloadAllShows);

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
    var title = req.body.title;

    if (title && title.length > 0) {
      var tvbDbUrl = 'http://thetvdb.com/api/GetSeries.php?seriesname=' + title;

      request(tvbDbUrl, function (error, response, body) {
        if (error) {
          log.error('TVDB error:', error);
          res.send(400, {error: error});
        } else {
          var parser = new xml2js.Parser({explicitArray: false});

          parser.parseString(body, function (err, result) {
            if (err) {
              log.error('TVDB error:', err);
              res.send(400, {error: err});
            } else {
              res.send(200, result.Data.Series);
            }
          });
        }
      });
    } else {
      res.send(400, {error: 'invalid title'});
    }
  },

  fetchPoster: function (req, res) {
    if (req.body.ids) {
      var id = req.body.ids.tvdb;

      if (id) {
        var url = 'http://thetvdb.com/data/series/' + id + '/';

        request(url, function (error, response, body) {
          if (error) {
            log.error('TVDB error:', error);
            res.send(400, {error: error});
          } else {
            var parser = new xml2js.Parser({explicitArray: false});

            parser.parseString(body, function (err, result) {
              if (err) {
                log.error('TVDB error:', err);
                res.send(400, {error: err});
              } else {
                res.send(200, {'poster': result.Data.Series.poster});
              }
            });
          }
        });
      } else {
        res.send(400, {error: 'invalid id'});
      }
    } else {
      res.send(400, {error: 'invalid id'});
    }
  },

  fetchTvRage: function (req, res) {
    var title = req.body.title;

    if (title) {
      getTvRageInfo(title, function (data) {
        var code = (_.isEmpty(data)) ? (400) : (200);
        res.send(code, data);
      });
    } else {
      res.send(400, {error: 'invalid title'});
    }
  },

  reloadAll: function (req, res) {
    reloadAllShows();
    res.send(200);
  }
};
