const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // 🔥 merge hotel filter if exists
    const filter = {
      _id: id,
      ...(req.filterObj || {}),
    };

    const document = await Model.findOneAndDelete(filter);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(204).send();
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const filter = {
      _id: req.params.id,
      ...(req.filterObj || {}), // 🔥 hotel injected here
    };

    const document = await Model.findOneAndUpdate(filter, req.body, {
      new: true,
    });

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ data: document });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({ data: newDoc });
  });

exports.getOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const filter = {
      _id: id,
      ...(req.filterObj || {}), // 🔥 critical line
    };

    const document = await Model.findOne(filter);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({ data: document });
  });


exports.getAll = (Model, modelName = '', options = {}) =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }

    const isAll = req.query.all === 'true';
    const shouldPaginate = options.paginate !== false;

    // Build base query
    let apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    let paginationResult;

    // ✅ Apply pagination ONLY if all !== true
    if (shouldPaginate && !isAll) {
      const documentsCounts = await Model.countDocuments(filter);
      apiFeatures = apiFeatures.paginate(documentsCounts);
      paginationResult = apiFeatures.paginationResult;
    }

    // Execute query
    const documents = await apiFeatures.mongooseQuery;

    res.status(200).json({
      results: documents.length,
      ...(paginationResult && { paginationResult }),
      data: documents
    });
  });
