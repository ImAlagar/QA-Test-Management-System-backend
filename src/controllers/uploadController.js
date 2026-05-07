// src/controllers/uploadController.js (Updated for separate tables)

const { prisma } = require('../config/database');
const { deleteFromCloudinary, getThumbnailUrl } = require('../config/cloudinary');

// @desc    Upload single screenshot for test case
// @route   POST /api/upload/testcase-screenshot
// @access  Private
const uploadTestCaseScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { testCaseId } = req.body;
    
    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId }
    });
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }
    
    const screenshot = await prisma.testCaseScreenshot.create({
      data: {
        url: req.file.path,
        key: req.file.filename,
        testCaseId
      }
    });
    
    res.json({
      success: true,
      data: {
        id: screenshot.id,
        url: screenshot.url,
        thumbnail: getThumbnailUrl(req.file.filename),
        publicId: req.file.filename,
        createdAt: screenshot.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple screenshots for test case
// @route   POST /api/upload/testcase-screenshots/multiple
// @access  Private
const uploadMultipleTestCaseScreenshots = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const { testCaseId } = req.body;
    
    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId }
    });
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }
    
    const screenshots = await Promise.all(
      req.files.map(file => 
        prisma.testCaseScreenshot.create({
          data: {
            url: file.path,
            key: file.filename,
            testCaseId
          }
        })
      )
    );
    
    res.json({
      success: true,
      data: screenshots.map(s => ({
        id: s.id,
        url: s.url,
        thumbnail: getThumbnailUrl(s.key),
        publicId: s.key,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload single screenshot for bug
// @route   POST /api/upload/bug-screenshot
// @access  Private
const uploadBugScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { bugId } = req.body;
    
    // Verify bug exists
    const bug = await prisma.bug.findUnique({
      where: { id: bugId }
    });
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    const screenshot = await prisma.bugScreenshot.create({
      data: {
        url: req.file.path,
        key: req.file.filename,
        bugId
      }
    });
    
    res.json({
      success: true,
      data: {
        id: screenshot.id,
        url: screenshot.url,
        thumbnail: getThumbnailUrl(req.file.filename),
        publicId: req.file.filename,
        createdAt: screenshot.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple screenshots for bug
// @route   POST /api/upload/bug-screenshots/multiple
// @access  Private
const uploadMultipleBugScreenshots = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const { bugId } = req.body;
    
    // Verify bug exists
    const bug = await prisma.bug.findUnique({
      where: { id: bugId }
    });
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    const screenshots = await Promise.all(
      req.files.map(file => 
        prisma.bugScreenshot.create({
          data: {
            url: file.path,
            key: file.filename,
            bugId
          }
        })
      )
    );
    
    res.json({
      success: true,
      data: screenshots.map(s => ({
        id: s.id,
        url: s.url,
        thumbnail: getThumbnailUrl(s.key),
        publicId: s.key,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test case screenshot
// @route   DELETE /api/upload/testcase-screenshot/:id
// @access  Private
const deleteTestCaseScreenshot = async (req, res, next) => {
  try {
    const screenshot = await prisma.testCaseScreenshot.findUnique({
      where: { id: req.params.id }
    });
    
    if (!screenshot) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot not found'
      });
    }
    
    // Delete from Cloudinary
    await deleteFromCloudinary(screenshot.key);
    
    // Delete from database
    await prisma.testCaseScreenshot.delete({
      where: { id: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Screenshot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bug screenshot
// @route   DELETE /api/upload/bug-screenshot/:id
// @access  Private
const deleteBugScreenshot = async (req, res, next) => {
  try {
    const screenshot = await prisma.bugScreenshot.findUnique({
      where: { id: req.params.id }
    });
    
    if (!screenshot) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot not found'
      });
    }
    
    // Delete from Cloudinary
    await deleteFromCloudinary(screenshot.key);
    
    // Delete from database
    await prisma.bugScreenshot.delete({
      where: { id: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Screenshot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test case screenshots
// @route   GET /api/upload/testcase/:testCaseId
// @access  Private
const getTestCaseScreenshots = async (req, res, next) => {
  try {
    const { testCaseId } = req.params;
    
    const screenshots = await prisma.testCaseScreenshot.findMany({
      where: { testCaseId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: screenshots.map(s => ({
        ...s,
        thumbnail: getThumbnailUrl(s.key)
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bug screenshots
// @route   GET /api/upload/bug/:bugId
// @access  Private
const getBugScreenshots = async (req, res, next) => {
  try {
    const { bugId } = req.params;
    
    const screenshots = await prisma.bugScreenshot.findMany({
      where: { bugId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: screenshots.map(s => ({
        ...s,
        thumbnail: getThumbnailUrl(s.key)
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadTestCaseScreenshot,
  uploadMultipleTestCaseScreenshots,
  uploadBugScreenshot,
  uploadMultipleBugScreenshots,
  deleteTestCaseScreenshot,
  deleteBugScreenshot,
  getTestCaseScreenshots,
  getBugScreenshots
};