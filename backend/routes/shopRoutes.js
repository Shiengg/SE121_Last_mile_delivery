const express = require('express');
const router = express.Router();
const { getAllShops, createShop, updateShop, deleteShop } = require('../controllers/shopController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use((req, res, next) => {
    console.log('Shop route accessed:', req.method, req.path);
    console.log('User:', req.user);
    next();
});

router.route('/')
    .get(protect, authorize('Admin'), getAllShops)
    .post(protect, authorize('Admin'), createShop);

router.route('/:id')
    .put(protect, authorize('Admin'), updateShop)
    .delete(protect, authorize('Admin'), deleteShop);

module.exports = router;
