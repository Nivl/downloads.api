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
    required: true,
    trim: true
  },
  wikipedia: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    trim: true
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
  },
  markedForDeletionDate: {
    type: Date
  }
});

ShowSchema.pre('save', function (next) {
  if (this.downloadLink.substr(0, 4) !== 'http') {
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