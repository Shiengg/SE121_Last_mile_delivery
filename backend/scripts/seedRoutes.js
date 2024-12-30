const mongoose = require('mongoose');
const Route = require('../models/Route');
require('dotenv').config();

const sampleRoutes = [
    {
        route_code: "R001",
        shop1_id: "26785001", // Mã shop 1 thuộc phường Trung Mỹ Tây
        shop2_id: "26787001", // Mã shop 1 thuộc phường Tân Hưng Thuận
        vehicle_type_id: "BIKE", // Mã loại phương tiện
        distance: 5.2,
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        route_code: "R002",
        shop1_id: "26787002", // Mã shop 2 thuộc phường Tân Hưng Thuận
        shop2_id: "26788001", // Mã shop 1 thuộc phường Đông Hưng Thuận
        vehicle_type_id: "MOTORBIKE",
        distance: 3.8,
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        route_code: "R003",
        shop1_id: "26788003", // Mã shop 3 thuộc phường Đông Hưng Thuận
        shop2_id: "26791001", // Mã shop 1 thuộc phường Tân Thới Nhất
        vehicle_type_id: "TRUCK",
        distance: 4.5,
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    }
];

const seedRoutes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'last_mile_delivery'
        });
        console.log('Connected to MongoDB - last_mile_delivery database');

        await mongoose.connection.collection('Route').deleteMany({});
        console.log('Cleared existing routes');

        const result = await mongoose.connection.collection('Route').insertMany(sampleRoutes);
        console.log('Sample routes created:', result);

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

seedRoutes();