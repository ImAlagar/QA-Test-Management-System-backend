const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for debugging
  console.error('Error:', err);
  
  // Prisma error handling
  if (err.code === 'P2002') {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }
  
  if (err.code === 'P2025') {
    error.message = 'Record not found';
    error.statusCode = 404;
  }
  
  if (err.code === 'P2003') {
    error.message = 'Foreign key constraint failed';
    error.statusCode = 400;
  }
  
  if (err.code === 'P2011') {
    error.message = 'Null constraint violation';
    error.statusCode = 400;
  }
  
  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File size too large. Maximum size is 10MB.';
    error.statusCode = 400;
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    error.message = 'Too many files. Maximum is 10 files.';
    error.statusCode = 400;
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.statusCode = 400;
  }
  
  // JWT error handling
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }
  
  // Cloudinary error handling
  if (err.message && err.message.includes('Cloudinary')) {
    error.message = 'Error uploading to cloud storage';
    error.statusCode = 500;
  }
  
  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorMiddleware };