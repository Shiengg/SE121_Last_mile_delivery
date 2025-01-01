require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/dbConnect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mongoose = require('mongoose');
const vehicleRoutes = require('./routes/vehicleRoutes');
const activityRoutes = require('./routes/activityRoutes');
const createTestActivity = require('./utils/testActivity');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');

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
        
        // Tạo collection Activities nếu chưa tồn tại
        if (!collections.find(c => c.name === 'activities')) {
            await mongoose.connection.db.createCollection('activities');
            console.log('Activities collection created');
        }
        
        // Kiểm tra collection Shop
        if (!collections.find(c => c.name === 'Shop')) {
            console.log('Warning: Shop collection not found');
        }
        
        // Uncomment để test
        // await createTestActivity();
    } catch (error) {
        console.error('Error:', error);
    }
});

// Kết nối routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);

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
                const methods = Object.keys(r.route.methods)
                    .map(method => method.toUpperCase())
                    .join(', ');
                console.log(`${methods} ${r.route.path}`);
            });
            
        // Khởi động server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            
            // Log all routes for debugging
            console.log('\nAvailable routes:');
            app._router.stack
                .filter(r => r.route)
                .forEach(r => {
                    const methods = Object.keys(r.route.methods)
                        .map(method => method.toUpperCase())
                        .join(', ');
                    console.log(`${methods} ${r.route.path}`);
                });
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection:', err);
});

// Thêm log để debug
console.log('Available routes:', app._router.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);
