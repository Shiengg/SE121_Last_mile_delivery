const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', req.body); // Debug log
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        console.log('Found user:', user ? 'Yes' : 'No'); // Debug log

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const payload = {
            id: user._id.toString(), // Ensure ID is a string
            role: user.role
        };
        console.log('Token payload:', payload); // Debug log

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('Generated token:', token); // Debug log

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
            message: 'Error logging in',
            error: error.message
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, role, fullName, email, phone } = req.body;

        // Kiểm tra role hợp lệ
        if (!['DeliveryStaff', 'Customer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be either DeliveryStaff or Customer'
            });
        }

        // Kiểm tra username đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
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
