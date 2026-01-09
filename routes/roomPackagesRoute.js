const express = require('express');
const router = express.Router();

const {
  createPackage,
  getPackages,
  getPackage,
  updatePackage,
  deletePackage,
} = require('../controller/packagesController');

const {
  createPackageValidator,
  getPackageValidator,
  updatePackageValidator,
  deletePackageValidator,
} = require('../utils/validators/packagesValidator');

router
  .route('/')
  .post(createPackageValidator, createPackage)
  .get(getPackages);

router
  .route('/:id')
  .get(getPackageValidator, getPackage)
  .put(updatePackageValidator, updatePackage)
  .delete(deletePackageValidator, deletePackage);

module.exports = router;
