const { prisma } = require('../config/database');

// @desc    Create a new bug
// @route   POST /api/bugs
// @access  Private
const createBug = async (req, res, next) => {
  try {
    const { screenshotIds, ...bugData } = req.body;
    
    const bug = await prisma.bug.create({
      data: {
        ...bugData,
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        testCase: {
          select: { id: true, title: true }
        },
        screenshots: true
      }
    });
    
    // Link screenshots to bug
    if (screenshotIds && screenshotIds.length > 0) {
      await prisma.screenshot.updateMany({
        where: { id: { in: screenshotIds } },
        data: { entityId: bug.id }
      });
    }
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CREATE_BUG',
        entityType: 'bug',
        entityId: bug.id,
        userId: req.user.id,
        details: { title: bug.title, severity: bug.severity }
      }
    });
    
    res.status(201).json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bugs with filtering and pagination
// @route   GET /api/bugs
// @access  Private
const getBugs = async (req, res, next) => {
  try {
    const {
      status,
      severity,
      assignedTo,
      createdBy,
      testCaseId,
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
    if (assignedTo) where.assignedTo = assignedTo;
    if (createdBy) where.createdBy = createdBy;
    if (testCaseId) where.testCaseId = testCaseId;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { stepsToReproduce: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Get sort order
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    // Execute queries
    const [bugs, total] = await Promise.all([
      prisma.bug.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          assignee: {
            select: { id: true, name: true, email: true }
          },
          testCase: {
            select: { id: true, title: true }
          },
          screenshots: {
            select: { id: true, url: true, createdAt: true }
          }
        },
        skip,
        take,
        orderBy
      }),
      prisma.bug.count({ where })
    ]);
    
    res.json({
      success: true,
      data: bugs,
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

// @desc    Get single bug by ID
// @route   GET /api/bugs/:id
// @access  Private
const getBugById = async (req, res, next) => {
  try {
    const bug = await prisma.bug.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        testCase: {
          select: { id: true, title: true, status: true }
        },
        screenshots: {
          select: { id: true, url: true, createdAt: true }
        }
      }
    });
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bug
// @route   PUT /api/bugs/:id
// @access  Private
const updateBug = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // If status is being set to resolved, add resolvedAt timestamp
    if (updateData.status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    
    // Check if bug exists
    const bugExists = await prisma.bug.findUnique({
      where: { id: req.params.id }
    });
    
    if (!bugExists) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    const bug = await prisma.bug.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        testCase: {
          select: { id: true, title: true }
        },
        screenshots: true
      }
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE_BUG',
        entityType: 'bug',
        entityId: bug.id,
        userId: req.user.id,
        details: { title: bug.title, changes: updateData }
      }
    });
    
    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bug
// @route   DELETE /api/bugs/:id
// @access  Private
const deleteBug = async (req, res, next) => {
  try {
    const bug = await prisma.bug.findUnique({
      where: { id: req.params.id },
      include: { screenshots: true }
    });
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    await prisma.bug.delete({
      where: { id: req.params.id }
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE_BUG',
        entityType: 'bug',
        entityId: bug.id,
        userId: req.user.id,
        details: { title: bug.title }
      }
    });
    
    res.json({
      success: true,
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign bug to developer
// @route   PUT /api/bugs/:id/assign
// @access  Private
const assignBug = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    
    const bug = await prisma.bug.update({
      where: { id: req.params.id },
      data: { assignedTo },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'ASSIGN_BUG',
        entityType: 'bug',
        entityId: bug.id,
        userId: req.user.id,
        details: { title: bug.title, assignedTo: bug.assignee?.name }
      }
    });
    
    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change bug status
// @route   PUT /api/bugs/:id/status
// @access  Private
const changeBugStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    
    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolutionNotes = resolutionNotes;
    }
    
    const bug = await prisma.bug.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CHANGE_BUG_STATUS',
        entityType: 'bug',
        entityId: bug.id,
        userId: req.user.id,
        details: { status, title: bug.title }
      }
    });
    
    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bug statistics
// @route   GET /api/bugs/stats/summary
// @access  Private
const getBugStats = async (req, res, next) => {
  try {
    const stats = await prisma.bug.groupBy({
      by: ['status', 'severity'],
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
  createBug,
  getBugs,
  getBugById,
  updateBug,
  deleteBug,
  assignBug,
  changeBugStatus,
  getBugStats
};