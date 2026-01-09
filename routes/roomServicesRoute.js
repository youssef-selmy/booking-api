const express = require('express');
const router = express.Router();

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
} = require('../controller/servicesController');

const {
  createServiceValidator,
  getServiceValidator,
  updateServiceValidator,
  deleteServiceValidator,
} = require('../utils/validators/servicesValidator');

router
  .route('/')
  .post(createServiceValidator, createService)
  .get(getServices);

router
  .route('/:id')
  .get(getServiceValidator, getService)
  .put(updateServiceValidator, updateService)
  .delete(deleteServiceValidator, deleteService);

module.exports = router;
