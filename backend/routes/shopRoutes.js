const express = require('express');
const router = express.Router();
const { getAllShops, createShop, updateShop, deleteShop } = require('../controllers/shopController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Protect all routes
router.use(protect);

// Get all shops
router.get('/', protect, authorize('Admin'), getAllShops);

// Create new shop
router.post('/', protect, authorize('Admin'), createShop);

// Update shop
router.put('/:id', protect, authorize('Admin'), updateShop);

// Delete shop
router.delete('/:id', protect, authorize('Admin'), deleteShop);

module.exports = router;
