require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/dbConnect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mongoose = require('mongoose');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Route mẫu
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Kiểm tra biến môi trường
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Log all registered routes
        console.log('Available routes:');
        app._router.stack
            .filter(r => r.route)
            .forEach(r => {
                console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
            });
            
        // Khởi động server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection:', err);
});
