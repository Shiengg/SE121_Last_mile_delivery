const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Đăng nhập
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Log để debug
    console.log('Login attempt for username:', username);

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log để debug
    console.log('Found user:', {
      username: user.username,
      hashedPassword: user.password
    });

    // Sử dụng bcrypt để so sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password không khớp'); // Log để debug
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Route đăng ký
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    
    try {
        // Kiểm tra user đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const user = new User({
            username,
            password: hashedPassword,
            role
        });

        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
    }
});

module.exports = router;