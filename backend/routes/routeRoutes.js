const express = require('express');
const router = express.Router();
const { createRoute, getAllRoutes, updateRouteStatus } = require('../controllers/routeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getAllRoutes)
    .post(createRoute);

router.route('/:id/status')
    .put(updateRouteStatus);

module.exports = router;
