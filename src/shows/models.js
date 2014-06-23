'use strict';

var mongoose = new require('mongoose');
var Schema = mongoose.Schema;

var ShowSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  downloadLink: {
    type: String,
    trim: true
  },
  wikipedia: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: Number,
    default: 1,
    min: 1,
    max: 7
  },
  returnDate: {
    type: String
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

  if (this.wikipedia.substr(0, 4) !== 'http') {
    this.wikipedia = 'https://' + this.wikipedia;
  }

  next();
});

var Show = mongoose.model('Show', ShowSchema);

module.exports = {
  Show: Show
};