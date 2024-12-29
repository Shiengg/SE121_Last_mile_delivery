require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/dbConnect');
const authRoutes = require('./routes/authRoutes');
const mongoose = require('mongoose');

const app = express();

// Thêm middleware CORS
app.use(cors());

// Middleware
app.use(express.json());

// Kết nối tới MongoDB
connectDB();

// Thêm đoạn này sau connectDB();
mongoose.connection.on('connected', async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Kiểm tra dữ liệu trong collection Users
        const users = await mongoose.connection.db.collection('Users').find({}).toArray();
        console.log('Users in database:', users);
    } catch (error) {
        console.error('Error checking database:', error);
    }
});

// Kết nối routes
app.use('/api/auth', authRoutes);

// Route mẫu
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Kiểm tra biến môi trường
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
