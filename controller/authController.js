// utils is a core module in node js
// it provides access to some utility functions
// one of the functions is promisify which converts a callback based function to a promise based function
// const { promisify } = require('util');
const utils = require('util');

const crypto = require('crypto');

const { promisify } = utils;

const jwt = require('jsonwebtoken');
const User = require('../model/userModel');

const appError = require('../utils/appError');

const sendEmail = require('../utils/email');
// const User = require('../model/userModel');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const generateSendToken = (user, statusCode, res) => {
  try {
    const token = generateToken(user._id);
    // send token to client in cookie
    // we are using cookies to store the token because it is more secure than storing it in local storage
    // because cookies are http only and cannot be accessed or modified by the browser
    // we are also setting the expires property of the cookie to the same as the token
    // so that the cookie will expire when the token expires
    // we are also setting the secure property of the cookie to true in production
    // so that the cookie will only be sent on an encrypted connection(https)

    res.cookie('jwt', token, {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    user.password = undefined;
    // secure: true means the cookie will only be sent on an encrypted connection(https)
    // httpOnly: true means the cookie cannot be accessed or modified by the browser
    // this is a security measure to prevent cross-site scripting attacks(XSS)
    res.status(statusCode).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      changedPasswordAfter: req.body.changedPasswordAfter,
    });

    // generating token from jwt
    generateSendToken(newUser, 201, res);
    //

    //   const token = generateToken(newUser._id);
    //   res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //       newUser,
    //     },
    //   });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // check if email and password exist

  if (!email || !password)
    return next(appError('Please provide email and password', 400));

  // check if user exist
  // we use .select("+password") to select password from the document because we originally set the select = false in the field.
  // if the + prefix in the password is not included it will only retur the password field and not the entire fields in the document
  const user = await User.findOne({ email }).select('+password');

  // here we need to compare the password the user put with the password in the database.
  // because the password in the database is encrypted(hashed) it will return false
  // for this we use bcrypt.compare method to do that
  // we will create function in the userModel using instance method of mongoDB so it can for all the documents in our collections(database) and pass it here.

  // comparePassword is an async and should e await

  // HOW BCRYPT.COMPARE WORKS

  // bcrypt.compare(plainTextPassword, hashedPassword);

  // First argument → the raw/plaintext password (what the user typed at login).

  // Second argument → the hashed password stored in the database.

  // In your code:
  // return await bcrypt.compare(databasePassword, inputPassword);

  if (!user || !(await user.comparePassword(password))) {
    return next(appError('Wrong password or email', 401));
  }

  generateSendToken(user, 200, res);
  // const token = generateToken(user._id);
  // res.status(200).json({
  //   sttatus: 'success',
  //   token,
  // });
};

exports.protect = async (req, res, next) => {
  // 1) Getting token and check if it's there
  // we are using the authorization header to send the token to the server
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(1);
  }

  if (!token)
    return next(
      appError('You are not logged in! Please log in to get access', 401),
    );
  // 2) verifying token
  // jwt.verify is use to verify the token
  // it takes 3 arguments the token, secret and a callback function
  // the callback function takes 2 arguments error and decoded
  // if the token is valid the error will be null and the decoded will contain the payload
  // if the token is invalid the error will contain the error message and the decoded will be undefined
  // we can also use the synchronous version of jwt.verify which returns the decoded payload if the token is valid and throws an error if the token is invalid
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // console.log(decoded);
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(appError('The bearer of this token does no longer exist', 401));
  // 4) check if user changed password after the token was issued

  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      appError('User recently changed password! Please log in again', 401),
    );

  // putting the current user in the request object(req) so that it can be accessed in the next middleware or controller
  // if we want to pass data from one middleware to another we can use the request object(req)

  req.user = currentUser;
  //
  next();
};

exports.restrictTo = function (...roles) {
  return function (req, res, next) {
    // roles is an array ['admin', 'lead-guide']. if the role of the user is not in the array, he is not authorized to access the route
    // req.user is gotten from the protect middleware
    // we can access req.user because this middleware(restrictTo) will be used after the protect middleware
    // only users with the right role are allowed to access the route
    // example req.user.role='admin'
    //  if the role of the user is not in the array, he is not authorized to access the route
    // example roles = ['admin', 'lead-guide']
    //  req.user.role='user'  ---> not authorized
    //  req.user.role='admin' ---> authorized
    //  req.user.role='lead-guide' ---> authorized
    //  req.user.role='guide' ---> not authorized
    //  req.user.role='user'  ---> not authorized
    //  roles=['admin', 'lead-guide']
    //  req.user.role='admin' ---> authorized
    //  req.user.role='lead-guide' ---> authorized
    //  req.user.role='guide' ---> not authorized
    //  req.user.role='user'  ---> not authorized

    // 403 means forbidden
    if (!roles.includes(req.user.role)) {
      return next(
        appError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  // 404 means not found

  if (!user)
    return next(appError('there is no user with that email address', 404));

  const resetToken = await user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  // send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      appError('There was an error sending the email. Try again later!', 500),
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  // 1) get user based on the token
  // enccrypt password sent as token and compare it with the ecrypted one in the database

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // 2) if token is not expired, and there is a user, set the new password

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(appError('Token is invalid or expired', 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) update changedPasswordAt property for the user
  // 4) log the user in, send jwt.

  generateSendToken(user, 200, res);

  // const token = generateToken(user._id);
  // res.status(200).json({
  //   sttatus: 'success',
  //   token,
  // });
};

exports.updatePassword = async (req, res, next) => {
  // 1) get user from collection
  // we do not use findByIdAndUpdate because the pre save middleware will not work
  // we need the pre save middleware to hash the password
  // req.user is gotten from the protect middleware

  const user = await User.findById(req.user.id).select('+password');
  // 2) check if posted current password is correct
  if (!(await user.comparePassword(req.body.password)))
    return next(appError('Your current password is wrong', 401));
  // 3) if so, update password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // 4) log user in, send jwt

  generateSendToken(user, 200, res);

  // const token = generateToken(user._id);
  // res.status(200).json({
  //   sttatus: 'success',
  //   token,
  // });
};
