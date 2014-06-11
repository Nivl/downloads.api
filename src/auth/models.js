'use strict';

var uuid = require('node-uuid');
var crypto = require('crypto');
var mongoose = require('mongoose');
var validate = require('mongoose-validate');
var Schema = mongoose.Schema;
var log = require('../api/log')(module);

//
// User
//

var UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate: [validate.email, 'format']
  },
  regDate: {
    type: Date,
    default: Date.now
  },
  hashedPassword: {
    type: String
  },
  salt: {
    type: String
  },
  loverId: {
    type: String
  }
});

UserSchema.plugin(require('mongoose-unique-validator'), { message: 'unique'});

UserSchema.methods.encryptPassword = function (password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

UserSchema.methods.checkPassword = function (password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

UserSchema.virtual('userId')
          .get(function () {
            return this.id;
          });

UserSchema.virtual('password')
          .set(function (password) {
            if (typeof password === 'undefined') {
              this.invalidate('password', 'required');
            } else {
              this.salt = crypto.randomBytes(128).toString('base64');
              this.hashedPassword = this.encryptPassword(password);
            }
          });

var User = mongoose.model('User', UserSchema);

//
// Client
//

var ClientSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  key: {
    type: String,
    unique: true
  },
  secret: {
    type: String
  }
});

ClientSchema.pre('save', function (next) {
  this.key = uuid();
  this.secret = crypto.createHash('sha256').update('salt').digest('hex');
  next();
});

var Client = mongoose.model('Client', ClientSchema);

//
// AccessToken
//

var AccessTokenSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var AccessToken = mongoose.model('AccessToken', AccessTokenSchema);

//
// RefreshToken
//

var RefreshTokenSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = {
  User: User,
  Client: Client,
  AccessToken: AccessToken,
  RefreshToken: RefreshToken
};
