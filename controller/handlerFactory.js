const appError = require('../utils/appError');

const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (model) => async (req, res, next) => {
  try {
    await model.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(appError(err.message, 400));
    // res.status(400).json({
    //   status: 'fail',
    //   message: err.message,
    // });
  }
};

exports.getAll = (model) => async (req, res) => {
  try {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // to get reviews for a specific tour when we have nested route for reviews with tourId

    const features = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // WE EXECUTE THE QUERY
    // const doc = await features.query.esplain();// to get the query plan, it explains how mongoDB will execute the query
    const doc = await features.query;
    // alternative way of filtering
    // const tours =  Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    //

    res.status(200).json({
      status: 'success',

      results: doc.length,
      data: {
        tours: doc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateOne = (model) => async (req, res, next) => {
  try {
    // under the hood mongoose uses findOneAndUpdate() to find the document by id and update it
    // we can also use findByIdAndUpdate() which is a shorthand for findOneAndUpdate()
    // both methods are similar and take the same parameters
    // the first parameter is the id of the document to be updated
    // the second parameter is the data to be updated
    // the third parameter is an object with options
    // new: true returns the updated document
    // runValidators: true runs the validators on the updated document
    // we are using async await to handle the promise returned by the mongoose method
    // we are also using try catch to handle any errors that may occur
    // we are passing the model as a parameter to make this function reusable for other models
    // e.g we can use this function to update a user or a review or any other model
    // we just need to pass the model as a parameter when we call the function
    // e.g updateOne(User) or updateOne(Review)
    // this is called a factory function
    // it is a function that returns another function
    // in this case it returns an async function that takes req, res and next as parameters
    const tour = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    // new: true returns the updated document
    // runValidators: true runs the validators on the updated document
    // req.body contains the data that we want to update the document with, it comes from the client
    // req.params.id contains the id of the document that we want to update, it comes from the client
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createOne = (model) => async (req, res, next) => {
  try {
    const newTour = await model.create(req.body);
    // Tour.create() is a mongoose method that creates a new document in the database
    // it returns a promise that resolves to the newly created document
    // req.body contains the data that we want to create the new document with in the database, it comes from te client
    res.status(201).json({
      status: 'success',
      data: {
        tours: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getOne = (model, optionPopulate) => async (req, res) => {
  // const id = Number(req.params.id);
  // under the hood mongoose uses findOne() to find the document by id
  // we can also use findById() which is a shorthand for findOne()
  // if we want to use regex to find the document by id, we have to use findOne(), because findById() does not support regex

  let doc;
  if (optionPopulate) {
    doc = await model.findById(req.params.id).populate(optionPopulate); // populate() is a mongoose method that populates the referenced documents in the query result
  } else {
    doc = await model.findById(req.params.id);
  }
  // findById() is a mongoose method that finds a document by its id
  // the difference between findById() and findOne() is that findById() takes the id as a parameter
  // while findOne() takes an object with the id as a property
  // so the equivalent of Tour.findById(req.params.id) is Tour.findOne({ _id: req.params.id })
  // req.params.id contains the id of the document that we want to find, it comes from the client
  // we can also use req.params to get other parameters from the url
  // eg if the url is /api/v1/tours/5 then req.params.id will be 5

  // const toue = await Tour.findOne({ _id: req.params.id });
  try {
    res.status(200).json({
      status: 'success',
      // data: { tours: tours.find((el) => el.id === id) },

      data: {
        tour: doc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
