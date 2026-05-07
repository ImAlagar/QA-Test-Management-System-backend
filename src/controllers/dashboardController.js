const { prisma } = require('../config/database');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Get all counts in parallel
    const [
      totalTestCases,
      testCasesByStatus,
      testCasesBySeverity,
      totalBugs,
      bugsByStatus,
      bugsBySeverity,
      recentTestCases,
      recentBugs,
      recentActivities,
      topContributors
    ] = await Promise.all([
      // Total test cases
      prisma.testCase.count(),
      
      // Test cases by status
      prisma.testCase.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Test cases by severity
      prisma.testCase.groupBy({
        by: ['severity'],
        _count: { id: true }
      }),
      
      // Total bugs
      prisma.bug.count(),
      
      // Bugs by status
      prisma.bug.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Bugs by severity
      prisma.bug.groupBy({
        by: ['severity'],
        _count: { id: true }
      }),
      
      // Recent test cases (last 10)
      prisma.testCase.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } }
        }
      }),
      
      // Recent bugs (last 10)
      prisma.bug.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { name: true } },
          assignee: { select: { name: true } }
        }
      }),
      
      // Recent activities (last 20)
      prisma.activity.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } }
        }
      }),
      
      // Top contributors (users with most test cases)
      prisma.testCase.groupBy({
        by: ['createdBy'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);
    
    // Get usernames for top contributors
    const topContributorsWithNames = await Promise.all(
      topContributors.map(async (contributor) => {
        const user = await prisma.user.findUnique({
          where: { id: contributor.createdBy },
          select: { name: true, email: true }
        });
        return {
          ...contributor,
          user
        };
      })
    );
    
    // Calculate pass rate
    const passedTests = testCasesByStatus.find(s => s.status === 'passed')?._count.id || 0;
    const passRate = totalTestCases > 0 ? ((passedTests / totalTestCases) * 100).toFixed(2) : 0;
    
    // Calculate bug resolution rate
    const resolvedBugs = bugsByStatus.find(s => s.status === 'resolved')?._count.id || 0;
    const closedBugs = bugsByStatus.find(s => s.status === 'closed')?._count.id || 0;
    const resolvedClosedBugs = resolvedBugs + closedBugs;
    const bugResolutionRate = totalBugs > 0 ? ((resolvedClosedBugs / totalBugs) * 100).toFixed(2) : 0;
    
    // Get open bugs count
    const openBugs = bugsByStatus
      .filter(s => s.status === 'open' || s.status === 'in-progress')
      .reduce((sum, item) => sum + item._count.id, 0);
    
    // Get weekly trend data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();
    
    const weeklyTestCases = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.testCase.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });
        
        return {
          date: date.toISOString().split('T')[0],
          count
        };
      })
    );
    
    const weeklyBugs = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.bug.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });
        
        return {
          date: date.toISOString().split('T')[0],
          count
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTestCases,
          passedTests,
          failedTests: testCasesByStatus.find(s => s.status === 'failed')?._count.id || 0,
          blockedTests: testCasesByStatus.find(s => s.status === 'blocked')?._count.id || 0,
          passRate: parseFloat(passRate),
          totalBugs,
          openBugs,
          resolvedBugs: resolvedBugs,
          closedBugs,
          bugResolutionRate: parseFloat(bugResolutionRate)
        },
        charts: {
          testCaseStatus: testCasesByStatus,
          testCaseSeverity: testCasesBySeverity,
          bugStatus: bugsByStatus,
          bugSeverity: bugsBySeverity,
          weeklyTestCases,
          weeklyBugs
        },
        recent: {
          testCases: recentTestCases,
          bugs: recentBugs,
          activities: recentActivities
        },
        contributors: topContributorsWithNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity timeline
// @route   GET /api/dashboard/activities
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    const { limit = 50, entityType } = req.query;
    
    const where = {};
    if (entityType) where.entityType = entityType;
    
    const activities = await prisma.activity.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get performance metrics
// @route   GET /api/dashboard/performance
// @access  Private
const getPerformanceMetrics = async (req, res, next) => {
  try {
    // Average time to resolve bugs
    const resolvedBugs = await prisma.bug.findMany({
      where: {
        resolvedAt: { not: null }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    });
    
    const avgResolutionTime = resolvedBugs.length > 0
      ? resolvedBugs.reduce((sum, bug) => {
          const diffTime = Math.abs(new Date(bug.resolvedAt) - new Date(bug.createdAt));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0) / resolvedBugs.length
      : 0;
    
    // Test execution rate
    const executedTests = await prisma.testCase.count({
      where: {
        executedAt: { not: null }
      }
    });
    
    const totalTests = await prisma.testCase.count();
    const executionRate = totalTests > 0 ? (executedTests / totalTests) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        avgResolutionTimeDays: avgResolutionTime.toFixed(1),
        executionRate: executionRate.toFixed(2),
        totalResolvedBugs: resolvedBugs.length,
        totalExecutedTests: executedTests
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getActivities,
  getPerformanceMetrics
};