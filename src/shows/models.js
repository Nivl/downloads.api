'use strict';
require('datejs');

var mongoose = new require('mongoose');
var Schema = mongoose.Schema;

var ShowSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  ids: {
    tmdbId: { type: Number }, //todo tmdb
    tvrageId: { type: Number }, //todo tvrage
    imdbId: { type: String } //todo imdb
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

  if (this.downloadLink &&  this.downloadLink.substr(0, 4) !== 'http') {
    this.downloadLink = 'https://' + this.downloadLink;
  }

  if (this.nextEpisode && this.nextEpisode.date && this.nextEpisode.date.length > 0) {
    parsedDate = Date.parse(this.nextEpisode.date).getTime();

    if (parsedDate) {
      this.nextEpisode.date = parsedDate;
    }
  }

  if (this.latestEpisode && this.latestEpisode.date && this.latestEpisode.date.length > 0) {
    parsedDate = Date.parse(this.latestEpisode.date).getTime();

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