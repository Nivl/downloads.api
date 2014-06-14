'use strict';

var express = require('express');

var controllers = require('./controllers');

/*
 * Routes
 */

var baseUrl = '/shows/';
var router = express.Router();

router.get(baseUrl + 'latest/', controllers.getLatestAired);
router.get(baseUrl + ':day/', controllers.getByDay);
router.get(baseUrl, controllers.getAll);
router.post(baseUrl, controllers.addShow);
router.put(baseUrl + ':id/', controllers.updateShow);

module.exports = router;