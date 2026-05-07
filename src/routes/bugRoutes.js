const express = require('express');
const {
  createBug,
  getBugs,
  getBugById,
  updateBug,
  deleteBug,
  assignBug,
  changeBugStatus,
  getBugStats
} = require('../controllers/bugController');
const { protect } = require('../middleware/authMiddleware');
const { validateBug } = require('../middleware/validationMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .post(validateBug, createBug)
  .get(getBugs);

router.get('/stats/summary', getBugStats);

router.route('/:id')
  .get(getBugById)
  .put(validateBug, updateBug)
  .delete(deleteBug);

router.put('/:id/assign', assignBug);
router.put('/:id/status', changeBugStatus);

module.exports = router;