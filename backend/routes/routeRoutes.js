const express = require('express');
const router = express.Router();
const { createRoute, getAllRoutes, updateRouteStatus, deleteRoute } = require('../controllers/routeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getAllRoutes)
    .post(createRoute);

router.route('/:id/status')
    .put(updateRouteStatus);

router.delete('/:id', protect, authorize('Admin'), deleteRoute);

module.exports = router;
