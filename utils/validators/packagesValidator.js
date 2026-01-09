const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// =============================
// CREATE PACKAGE VALIDATOR
// =============================
exports.createPackageValidator = [
  check('name')
    .notEmpty()
    .withMessage('Package name is required')
    .isLength({ min: 2 })
    .withMessage('Package name must be at least 2 characters'),

  check('price')
    .notEmpty()
    .withMessage('Package price is required')
    .isFloat({ min: 0 })
    .withMessage('Package price must be a positive number'),

  validatorMiddleware,
];

// =============================
// GET PACKAGE VALIDATOR
// =============================
exports.getPackageValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid package id format'),
  validatorMiddleware,
];

// =============================
// UPDATE PACKAGE VALIDATOR
// =============================
exports.updatePackageValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid package id format'),

  check('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Package name must be at least 2 characters'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Package price must be a positive number'),

  validatorMiddleware,
];

// =============================
// DELETE PACKAGE VALIDATOR
// =============================
exports.deletePackageValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid package id format'),
  validatorMiddleware,
];
