const { prisma } = require('../config/database');

// @desc    Create a new test case
// @route   POST /api/testcases
// @access  Private
const createTestCase = async (req, res, next) => {
  try {
    const { screenshotIds, ...testCaseData } = req.body;
    
    const testCase = await prisma.testCase.create({
      data: {
        ...testCaseData,
        createdBy: req.user.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        screenshots: true
      }
    });
    
    // Link screenshots to test case
    if (screenshotIds && screenshotIds.length > 0) {
      await prisma.screenshot.updateMany({
        where: { id: { in: screenshotIds } },
        data: { entityId: testCase.id }
      });
    }
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CREATE_TESTCASE',
        entityType: 'testcase',
        entityId: testCase.id,
        userId: req.user.id,
        details: { title: testCase.title, severity: testCase.severity }
      }
    });
    
    res.status(201).json({
      success: true,
      data: testCase
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all test cases with filtering and pagination
// @route   GET /api/testcases
// @access  Private
const getTestCases = async (req, res, next) => {
  try {
    const {
      status,
      severity,
      priority,
      environment,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter conditions
    const where = {};
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (priority) where.priority = priority;
    if (environment) where.environment = environment;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { steps: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Get sort order
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    // Execute queries
    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          screenshots: {
            select: { id: true, url: true, createdAt: true }
          },
          bugs: {
            select: { id: true, title: true, severity: true, status: true }
          }
        },
        skip,
        take,
        orderBy
      }),
      prisma.testCase.count({ where })
    ]);
    
    res.json({
      success: true,
      data: testCases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test case by ID
// @route   GET /api/testcases/:id
// @access  Private
const getTestCaseById = async (req, res, next) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        screenshots: {
          select: { id: true, url: true, createdAt: true }
        },
        bugs: {
          include: {
            creator: { select: { name: true } },
            assignee: { select: { name: true } }
          }
        }
      }
    });
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }
    
    res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test case
// @route   PUT /api/testcases/:id
// @access  Private
const updateTestCase = async (req, res, next) => {
  try {
    const { screenshotIds, ...updateData } = req.body;
    
    // Check if test case exists
    const testCaseExists = await prisma.testCase.findUnique({
      where: { id: req.params.id }
    });
    
    if (!testCaseExists) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }
    
    // Update test case
    const testCase = await prisma.testCase.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        screenshots: true
      }
    });
    
    // Update screenshots if provided
    if (screenshotIds && screenshotIds.length > 0) {
      await prisma.screenshot.updateMany({
        where: { id: { in: screenshotIds } },
        data: { entityId: testCase.id }
      });
    }
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE_TESTCASE',
        entityType: 'testcase',
        entityId: testCase.id,
        userId: req.user.id,
        details: { title: testCase.title, changes: updateData }
      }
    });
    
    res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test case
// @route   DELETE /api/testcases/:id
// @access  Private
const deleteTestCase = async (req, res, next) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: { screenshots: true }
    });
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }
    
    // Delete test case (screenshots will be orphaned, handle separately)
    await prisma.testCase.delete({
      where: { id: req.params.id }
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE_TESTCASE',
        entityType: 'testcase',
        entityId: testCase.id,
        userId: req.user.id,
        details: { title: testCase.title }
      }
    });
    
    res.json({
      success: true,
      message: 'Test case deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute test case (update status and actual result)
// @route   PUT /api/testcases/:id/execute
// @access  Private
const executeTestCase = async (req, res, next) => {
  try {
    const { status, actualResult, executedBy } = req.body;
    
    const testCase = await prisma.testCase.update({
      where: { id: req.params.id },
      data: {
        status,
        actualResult,
        executedBy: executedBy || req.user.id,
        executedAt: new Date()
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'EXECUTE_TESTCASE',
        entityType: 'testcase',
        entityId: testCase.id,
        userId: req.user.id,
        details: { status, title: testCase.title }
      }
    });
    
    res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test case statistics
// @route   GET /api/testcases/stats/summary
// @access  Private
const getTestCaseStats = async (req, res, next) => {
  try {
    const stats = await prisma.testCase.groupBy({
      by: ['status', 'severity', 'priority'],
      _count: { id: true }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTestCase,
  getTestCases,
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
  executeTestCase,
  getTestCaseStats
};