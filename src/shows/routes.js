'use strict';

var express = require('express');

var controllers = require('./controllers');

/*
 * Routes
 */

var baseUrl = '/shows/';
var router = express.Router();

router.get(baseUrl, controllers.getAll);
router.post(baseUrl, controllers.addShow);
router.put(baseUrl + ':id/', controllers.updateShow);
router.delete(baseUrl + ':id/', controllers.removeShow);


router.post(baseUrl + 'fetch-info/', controllers.fetchInfo);

module.exports = router;