require('dotenv').config();
const express = require('express');
const connectDB = require('./utils/dbConnect');

const app = express();

// Middleware
app.use(express.json());

// Kết nối tới MongoDB
connectDB();

// Route mẫu
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
