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


// Change tvdb by "synopsis' and TvRage by "dates"
router.post(baseUrl + 'fetch/tvdb/', controllers.fetchTvDb);
router.post(baseUrl + 'fetch/tvrage/', controllers.fetchTvRage);
router.post(baseUrl + 'fetch/poster/', controllers.fetchPoster);

module.exports = router;