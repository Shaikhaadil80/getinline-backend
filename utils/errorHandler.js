class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).json({
    success: false,
    message: message || 'Internal Server Error',
  });
};

module.exports = { AppError, errorHandler };