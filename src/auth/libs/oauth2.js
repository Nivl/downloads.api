var oauth2orize         = require('oauth2orize');
var passport            = require('passport');
var crypto              = require('crypto');

//var log                 = require('../../api.melvin.re/log')(module);
var config              = require('../../../config').current;
var models              = require('../models');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange email & password for access token.
server.exchange(oauth2orize.exchange.password(function (client, email, password, scope, done) {
  'use strict';

  models.User.findOne({email: email}, function (err, user) {
    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false);
    }

    if (!user.checkPassword(password)) {
      return done(null, false);
    }

    models.RefreshToken.remove({ userId: user.id, clientId: client.id }, function (err) {
      if (err) {
        return done(err);
      }
    });

    models.AccessToken.remove({ userId: user.id, clientId: client.id }, function (err) {
      if (err) {
        return done(err);
      }
    });

    var tokenValue = crypto.randomBytes(32).toString('base64');
    var refreshTokenValue = crypto.randomBytes(32).toString('base64');

    var token = new models.AccessToken({
      token: tokenValue,
      clientId: client.id,
      userId: user.id
    });

    var refreshToken = new models.RefreshToken({
      token: refreshTokenValue,
      clientId: client.id,
      userId: user.id
    });

    refreshToken.save(function (err) {
      if (err) { return done(err); }
    });

    token.save(function (err) {
      if (err) {
        return done(err);
      }
      done(null, tokenValue, refreshTokenValue, {
        'expires_in': config.security.tokenLife,
        scope: '*'
      });
    });
  });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
  'use strict';

  models.RefreshToken.findOne({ token: refreshToken }, function (err, token) {
    if (err) {
      return done(err);
    }

    if (!token) {
      return done(null, false);
    }

    if (!token) {
      return done(null, false);
    }

    models.User.findById(token.userId, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      models.RefreshToken.remove({ userId: user.id, clientId: client.id }, function (err) {
        if (err) {
          return done(err);
        }
      });

      models.AccessToken.remove({ userId: user.id, clientId: client.id }, function (err) {
        if (err) {
          return done(err);
        }
      });

      var tokenValue = crypto.randomBytes(32).toString('base64');
      var refreshTokenValue = crypto.randomBytes(32).toString('base64');
      var token = new models.AccessToken({
        token: tokenValue,
        clientId: client.id,
        userId: user.id
      });
      var refreshToken = new models.RefreshToken({
        token: refreshTokenValue,
        clientId: client.id,
        userId: user.id
      });

      refreshToken.save(function (err) {
        if (err) { return done(err); }
      });

      token.save(function (err) {
        if (err) {
          return done(err);
        }
        done(null, tokenValue, refreshTokenValue, {
          'expires_in': config.security.tokenLife,
          scope: '*'
        });
      });
    });
  });
}));

// token endpoint
exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
];
