// crypto is a built-in module in nodejs we don't need to install it

const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'You must provide your name'] },
  email: {
    type: String,
    required: [true, 'You must provide your email address'],
    unique: [true, 'The email you provided is already in existence'],
    lowercase: true, // it is not a validators, turns the field to a lowercace

    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },

  photo: { type: String },

  password: { type: String, required: true, select: false },
  confirmPassword: {
    type: String,
    required: true,

    validate: {
      // this only works on CREATE and SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
});

// MIDDLEWARE TO ENCRYPT PASSWORD
// it runs between getting the data and persisting (saving) in the database

userSchema.pre('save', async function (next) {
  // checking if there a change in the password, if there is no change go to the next function or middleware
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // this is to delete the confirmPassword so it wouldn't be persisted in the database.
  // we only need confirm password for validation, to make sure the user doesn't forget his password.
  // it works even though we set confirmPassword to required, this because required happens during the input and not during persisting data, so it can deleted with a middleware that runs between the input time and persisting data.
  this.confirmPassword = undefined;
});

// MIDDLEWARE TO SET PASSWORDCHANGEDAT PROPERTY FOR THE USER
// it runs between getting the data and persisting (saving) in the database when the password is changed

userSchema.pre('save', function (next) {
  // if the password is not modified or the document is new, go to the next middleware
  // isNew is true when a new document is created
  // we don't want to set passwordChangedAt when the user is created for the first time
  // we only want to set passwordChangedAt when the user changes his password
  // because when the user is created for the first time, there is no need to check if the password was changed after the token was issued
  // so we only set passwordChangedAt when the password is modified and the document is not new
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // to make sure the token is always created after the password has been changed
  next();
});

// QUERY MIDDLEWARE TO FILTER OUT DEACTIVATED USERS
// it runs before any find query
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  // we want to find all users whose active field is not equal to false
  // because we set active to false when the user is deactivated
  // so for every find query, we want to exclude the deactivated users
  this.find({ active: { $ne: false } });
  next();
});

// an instance method to compare passwords
// available in all the documents(users) in collections(database)

userSchema.methods.comparePassword = async function (inputPassword) {
  //   this.password will be available if the query included it (.select('+password')).

  // If you forget to .select('+password'), then this.password will be undefined → bcrypt compare will fail.

  // 🔐 Why it’s still correct

  // When a new user signs up, this.password exists (it’s being saved), so pre('save') middleware and hashing work fine.

  // When logging in, you must fetch the password explicitly using .select('+password'). That’s why in the login controller we wrote:

  // if we didn't fetch the password explicitly using .select('+password'), we would set another databasePassword in the parameter to use and compare during login

  // using bcrypt to compare the password in database(databasePassword) and the on provided by who wants to login (inputPassword)

  // HOW BCRYPT.COMPARE WORKS

  // bcrypt.compare(plainTextPassword, hashedPassword);

  // First argument → the raw/plaintext password (what the user typed at login).

  // Second argument → the hashed password stored in the database.

  // In your code:
  // return await bcrypt.compare(databasePassword, inputPassword);

  return await bcrypt.compare(inputPassword, this.password);
};

// instance method to check if user changed password after the token was issued
// this method will be available in all the documents(users) in collections(database)

userSchema.methods.changedPasswordAfter = function (JWTissuedAt) {
  const JWTissuedAtTimestamp = new Date(JWTissuedAt * 1000);

  if (this.passwordChangedAt) {
    return JWTissuedAtTimestamp < this.passwordChangedAt;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // crypto is a built-in module in nodejs
  // we use crypto because it is more secure than using Math.random() and less complex than using bcrypt

  // it provides cryptographic functionality that includes a set of wrappers for openSSL hash, hmac, cipher, decipher, sign and verify functions

  // we create this token to send to the user so that when the user sends it back we can verify it and allow the user to change password
  const resetToken = crypto.randomBytes(32).toString('hex');

  // we encrypt the token before saving it in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // the token will expire in 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
