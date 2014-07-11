'use strict';

require('datejs');
var mongoose = new require('mongoose');
var moment = require('moment-timezone');
var Schema = mongoose.Schema;

var ShowSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  ids: {
    tvrageId: { type: Number },
    tvrage: { type: Number },
    tvdb: { type: Number }
  },
  synopsis: {
    type: String,
    trim: true
  },
  poster: {
    type: String,
    trim: true
  },
  downloadLink: {
    type: String,
    trim: true
  },
  day: {
    type: Number,
    default: 1,
    min: 1,
    max: 7
  },
  nextEpisode : {
    title: { type: String },
    date: { type: String }
  },
  latestEpisode : {
    title: { type: String },
    date: { type: String }
  },
  isCompleted: { //todo isComplete
    type: Boolean,
    default: false
  },
  isCancelled: { //todo hasBeenCanceled
    type: Boolean,
    default: false
  }
});

ShowSchema.plugin(require('mongoose-merge-plugin'));

ShowSchema.pre('save', function (next) {
  var parsedDate = null;
  var isoDate = null;
  var zone = null;
  var delta = 0;

  if (this.downloadLink &&  this.downloadLink.substr(0, 4) !== 'http') {
    this.downloadLink = 'https://' + this.downloadLink;
  }

  if (this.nextEpisode && this.nextEpisode.date && this.nextEpisode.date.length > 0) {
    parsedDate = Date.parse(this.nextEpisode.date);
    isoDate = parsedDate.toISOString().replace(/\"/g, '');
    zone = moment(isoDate).zone() / 60;
    parsedDate = parsedDate.getTime();
    delta = 3600 * (7 - zone);
    parsedDate += delta * 1000;

    if (parsedDate) {
      this.nextEpisode.date = parsedDate;
    }
  }

  if (this.latestEpisode && this.latestEpisode.date && this.latestEpisode.date.length > 0) {
    parsedDate = Date.parse(this.latestEpisode.date);
    isoDate = parsedDate.toISOString().replace(/\"/g, '');
    zone = moment(isoDate).zone() / 60;
    parsedDate = parsedDate.getTime();
    delta = 3600 * (7 - zone);
    parsedDate += delta * 1000;

    if (parsedDate) {
      this.latestEpisode.date = parsedDate;
    }
  }

  next();
});

var Show = mongoose.model('Show', ShowSchema);

module.exports = {
  Show: Show
};