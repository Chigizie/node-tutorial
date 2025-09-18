function appError(message, statusCode) {
  const error = new Error(message);
  const status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
  const isOperational = true;
  Error.captureStackTrace(error, appError);
  error.status = status;
  error.statusCode = statusCode;
  error.isOperational = isOperational;

  return error;
}
module.exports = appError;
