require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/dbConnect');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const districtRoutes = require('./routes/districtRoutes');
const wardRoutes = require('./routes/wardRoutes');
const routeRoutes = require('./routes/routeRoutes');
const customerRoutes = require('./routes/customerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
connectDB();

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/customer', customerRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server only after MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Log all available routes
        console.log('\nRegistered routes:');
        app._router.stack
            .filter(r => r.route || (r.name === 'router'))
            .forEach(r => {
                if (r.route) {
                    const methods = Object.keys(r.route.methods)
                        .map(method => method.toUpperCase())
                        .join(', ');
                    console.log(`${methods} ${r.route.path}`);
                } else {
                    console.log(`Router middleware: ${r.regexp}`);
                }
            });
            
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
