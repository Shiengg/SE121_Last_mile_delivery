const express = require('express');
const router = express.Router();
const { getAllShops } = require('../controllers/shopController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('Admin'), getAllShops);

module.exports = router;
