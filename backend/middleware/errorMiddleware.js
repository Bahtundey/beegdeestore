
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
};


const errorHandler = (err, req, res, next) => {
  
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }

 
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('. ') || 'Invalid input';
    return res.status(400).json({ success: false, message });
  }

  
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

 
  if (statusCode >= 500) {
    console.error('Unhandled error:', err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
  });
};

module.exports = { notFound, errorHandler };
