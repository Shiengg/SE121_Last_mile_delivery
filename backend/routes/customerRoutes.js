const express = require('express');
const router = express.Router();
const { 
  getRouteByCode,
  getRouteStatus
} = require('../controllers/customerController');

// Public routes
router.get('/routes/:code', getRouteByCode);
router.get('/routes/:code/status', getRouteStatus);

module.exports = router;
