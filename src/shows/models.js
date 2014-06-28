'use strict';

var mongoose = new require('mongoose');
var Schema = mongoose.Schema;

var ShowSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  ids: {
    tmdbId: { type: Number },
    tvrageId: { type: Number },
    imdbId: { type: String }
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
  isCompleted: {
    type: Boolean,
    default: false
  },
  isCancelled: {
    type: Boolean,
    default: false
  }
});

ShowSchema.plugin(require('mongoose-merge-plugin'));

ShowSchema.pre('save', function (next) {
  if (this.downloadLink &&  this.downloadLink.substr(0, 4) !== 'http') {
    this.downloadLink = 'https://' + this.downloadLink;
  }

  next();
});

var Show = mongoose.model('Show', ShowSchema);

module.exports = {
  Show: Show
};