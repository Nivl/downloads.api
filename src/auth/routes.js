'use strict';

var passport = require('passport');
var express = require('express');

var ctrls = require('./controllers');
var oauth2 = require('./libs/oauth2');

/*
 * Routes
 */

var authNeeded = passport.authenticate('bearer', { session: false });
var baseUrl = '/auth/';
var router = express.Router();

// User
var userUrl = baseUrl + 'users/';
router.get(userUrl + '', authNeeded, ctrls.userList); // Auth
router.post(userUrl + 'add/', ctrls.userAdd);
router.get(userUrl + 'get/:id/', authNeeded, ctrls.userGet); // Auth

// Clients
var clientUrl = baseUrl + 'clients/';
router.post(clientUrl + 'add/', ctrls.clientAdd);

// Security
router.post(baseUrl + 'access/token', oauth2.token);

module.exports = router;
