const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Kiểm tra status nếu là DeliveryStaff
        if (user.role === 'DeliveryStaff' && user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Your account is currently inactive. Please contact administrator for activation.'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Create token
        const payload = {
            id: user._id.toString(),
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login. Please try again later.'
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, role, fullName, email, phone } = req.body;

        if (!['DeliveryStaff', 'Customer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be either DeliveryStaff or Customer'
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Set initial status based on role
        const status = role === 'DeliveryStaff' ? 'inactive' : 'active';

        const user = await User.create({
            username,
            password: hashedPassword,
            role,
            status, // Set initial status
            fullName,
            email,
            phone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || username)}&background=0D8ABC&color=fff`
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};
