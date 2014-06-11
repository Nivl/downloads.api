var passport                = require('passport');
var BasicStrategy           = require('passport-http').BasicStrategy;
var ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy;
var BearerStrategy          = require('passport-http-bearer').Strategy;

//var log                     = require('../../api.melvin.re/log')(module);
var config                  = require('../../../config');
var models                  = require('../models');

passport.use(new BasicStrategy(
  function (username, password, done) {
    'use strict';

    models.Client.findOne({ key: username }, function (err, client) {
      if (err) {
        return done(err);
      }

      if (!client) {
        return done(null, false);
      }

      if (client.secret !== password) {
        return done(null, false);
      }

      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function (key, secret, done) {
    'use strict';

    models.Client.findOne({key: key}, function (err, client) {
      if (err) {
        return done(err);
      }

      if (!client) {
        return done(null, false);
      }

      if (client.secret !== secret) {
        return done(null, false);

      }

      return done(null, client);
    });
  }
));

passport.use(new BearerStrategy(
  function (accessToken, done) {
    'use strict';

    models.AccessToken.findOne({ token: accessToken }, function (err, token) {
      if (err) {
        return done(err);
      }

      if (!token) {
        return done(null, false);
      }

      if (Math.round((Date.now() - token.created) / 1000) > config.security.tokenLife) {
        models.AccessToken.remove({ token: accessToken }, function (err) {
          if (err) {
            return done(err);
          }
        });

        return done(null, false, { message: 'Token expired' });
      }

      models.User.findById(token.userId, function (err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }

        var info = { scope: '*' };
        done(null, user, info);
      });
    });
  }
));
