const morgan = require('morgan');
const dotenv = require('dotenv');
const express = require('express');

const appError = require('./utils/appError');

const app = express();
dotenv.config({ path: './config.env' });

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Middleware for logging requests
}

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// app.use is a middleware

// middleware is a function that can modify the request and response objects
// middleware runs in the order they are defined

app.use(express.json()); // Middleware to parse JSON bodies

// console.log(process.env);

app.use(express.static(`${__dirname}/public`)); // Serve static files from the public directory

// Middleware to log the request time
// This will add a requestTime property to the request object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handling unhandled routes
// This middleware will be executed for all HTTP methods (GET, POST, etc.) and all routes that are not defined above

// The order of middleware is important, this should be defined after all the routes are defined, when no route is matched then this middleware will be executed, when a request is made express will check all the routes defined above and if none of them match then it will come to this middleware

// if we put this middleware before the routes then it will be executed for all the requests and the routes will never be reached
// the answer to every request will be 404 not found, because this middleware will be executed for all the requests before the routes are checked and it matches every request, GET, POST, DELETE, UPDATE etc.

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`,
  // });

  //  This code is an Express middleware function, typically used as a "catch-all" for requests that don't match any route. Here's what happens:

  // - In Express, passing an error to `next()` skips all remaining non-error middlewares and goes directly to error-handling middleware (functions with four parameters: `err, req, res, next`).
  // - This allows centralized error handling and consistent error responses.

  // This middleware catches all unmatched routes.
  // Instead of sending a 404 response directly, it creates an error and passes it to next().
  // In Express, passing an error to next() triggers error-handling middleware,
  // allowing centralized error handling for the application.

  next(appError(`can't find ${req.originalUrl} on this server`, 404));
});

// ERROR HANDLLING MIDDLEWARE
// by specifying 4 parameters express alreading know that its an error handling middleware and err comes first in the parameters.
const devError = (err, req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const proError = (err, req, res) => {
  let error = { ...err };
  error.message = err.message;
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}.`;
    error = appError(message, 400);
  }
  if (err.code === 11000) {
    const message = `Duplicate field value: ${JSON.stringify(err.keyValue)}. Please use another value!`;
    error = appError(message, 400);
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = appError(message, 400);
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = appError(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = appError(message, 401);
  }
};

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    devError(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    proError(err, req, res);
  }

  next();
});

module.exports = app;
