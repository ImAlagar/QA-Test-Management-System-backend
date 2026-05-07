const express = require('express');
const {
  createTestCase,
  getTestCases,
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
  executeTestCase,
  getTestCaseStats
} = require('../controllers/testCaseController');
const { protect } = require('../middleware/authMiddleware');
const { validateTestCase } = require('../middleware/validationMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .post(validateTestCase, createTestCase)
  .get(getTestCases);

router.get('/stats/summary', getTestCaseStats);

router.route('/:id')
  .get(getTestCaseById)
  .put(validateTestCase, updateTestCase)
  .delete(deleteTestCase);

router.put('/:id/execute', executeTestCase);

module.exports = router;