const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// =============================
// CREATE PRICING VALIDATOR
// =============================
exports.createPricingValidator = [
  check('name')
    .notEmpty()
    .withMessage('Pricing name is required')
    .isLength({ min: 2 })
    .withMessage('Pricing name must be at least 2 characters'),

  check('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  validatorMiddleware,
];

// =============================
// GET PRICING VALIDATOR
// =============================
exports.getPricingValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid pricing id format'),
  validatorMiddleware,
];

// =============================
// UPDATE PRICING VALIDATOR
// =============================
exports.updatePricingValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid pricing id format'),

  check('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Pricing name must be at least 2 characters'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  validatorMiddleware,
];

// =============================
// DELETE PRICING VALIDATOR
// =============================
exports.deletePricingValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid pricing id format'),
  validatorMiddleware,
];
