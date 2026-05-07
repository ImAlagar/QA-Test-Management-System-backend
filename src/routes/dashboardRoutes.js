const express = require('express');
const {
  getDashboardStats,
  getActivities,
  getPerformanceMetrics
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/activities', getActivities);
router.get('/performance', getPerformanceMetrics);

module.exports = router;