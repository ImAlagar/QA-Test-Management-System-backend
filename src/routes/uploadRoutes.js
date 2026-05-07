const express = require('express');
const {
  uploadTestCaseScreenshot,
  uploadMultipleTestCaseScreenshots,
  uploadBugScreenshot,
  uploadMultipleBugScreenshots,
  deleteTestCaseScreenshot,
  deleteBugScreenshot,
  getTestCaseScreenshots,
  getBugScreenshots
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadMultiple } = require('../config/cloudinary');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Test case screenshot routes
router.post('/testcase-screenshot', upload.single('screenshot'), uploadTestCaseScreenshot);
router.post('/testcase-screenshots/multiple', uploadMultiple.array('screenshots', 10), uploadMultipleTestCaseScreenshots);
router.delete('/testcase-screenshot/:id', deleteTestCaseScreenshot);
router.get('/testcase/:testCaseId', getTestCaseScreenshots);

// Bug screenshot routes
router.post('/bug-screenshot', upload.single('screenshot'), uploadBugScreenshot);
router.post('/bug-screenshots/multiple', uploadMultiple.array('screenshots', 10), uploadMultipleBugScreenshots);
router.delete('/bug-screenshot/:id', deleteBugScreenshot);
router.get('/bug/:bugId', getBugScreenshots);

module.exports = router;