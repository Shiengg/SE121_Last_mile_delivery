const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Received token:', token); // Debug log

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded); // Debug log

            // Get user from token
            const user = await User.findById(decoded.id);
            console.log('Found user:', user); // Debug log

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Add user to request
            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            error: error.message
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
