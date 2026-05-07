const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const validateRegister = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
];

const validateTestCase = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').notEmpty().withMessage('Description is required'),
  body('steps').notEmpty().withMessage('Test steps are required'),
  body('expectedResult').notEmpty().withMessage('Expected result is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('environment').isIn(['development', 'staging', 'production']).withMessage('Invalid environment'),
  body('status').optional().isIn(['pending', 'passed', 'failed', 'blocked']).withMessage('Invalid status'),
  validateRequest
];

const validateBug = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').notEmpty().withMessage('Description is required'),
  body('stepsToReproduce').notEmpty().withMessage('Steps to reproduce are required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('environment').notEmpty().withMessage('Environment is required'),
  validateRequest
];

module.exports = {
  validateLogin,
  validateRegister,
  validateTestCase,
  validateBug
};