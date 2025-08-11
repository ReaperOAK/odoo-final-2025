const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: true,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      message: 'Token expired'
    });
  }

  // MongoDB connection error
  if (err.name === 'MongoError') {
    return res.status(503).json({
      error: true,
      message: 'Database connection error'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorMiddleware;
