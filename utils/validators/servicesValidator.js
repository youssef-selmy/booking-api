const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// =============================
// CREATE SERVICE VALIDATOR
// =============================
exports.createServiceValidator = [
  check('name')
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 2 })
    .withMessage('Service name must be at least 2 characters'),

  check('price')
    .notEmpty()
    .withMessage('Service price is required')
    .isFloat({ min: 0 })
    .withMessage('Service price must be a positive number'),

  validatorMiddleware,
];

// =============================
// GET SERVICE VALIDATOR
// =============================
exports.getServiceValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid service id format'),
  validatorMiddleware,
];

// =============================
// UPDATE SERVICE VALIDATOR
// =============================
exports.updateServiceValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid service id format'),

  check('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Service name must be at least 2 characters'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Service price must be a positive number'),

  validatorMiddleware,
];

// =============================
// DELETE SERVICE VALIDATOR
// =============================
exports.deleteServiceValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid service id format'),
  validatorMiddleware,
];
