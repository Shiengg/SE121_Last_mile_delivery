const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware kiểm tra xác thực
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid Token' });
  }
};

// Middleware phân quyền
const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  next();
};

module.exports = { authenticate, authorize };
