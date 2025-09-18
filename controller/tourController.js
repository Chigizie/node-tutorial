// const fs = require('fs');
const Tour = require('../model/tourmodel');

const ApiFeatures = require('../utils/apiFeatures');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,prrice';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}; // middleware function to preset the query parameters for top 5 cheap tours endpoint,

exports.getAllTours = async (req, res) => {
  try {
    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // WE EXECUTE THE QUERY
    const tours = await features.query;
    // alternative way of filtering
    // const tours =  Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    //

    res.status(200).json({
      status: 'success',

      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTourById = async (req, res) => {
  // const id = Number(req.params.id);
  const tour = await Tour.findById(req.params.id);
  // const toue = await Tour.findOne({ _id: req.params.id });
  try {
    res.status(200).json({
      status: 'success',
      // data: { tours: tours.find((el) => el.id === id) },

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

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
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

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
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

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// Aggregation Pipeline
// to get some statistics about the tours
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: '$difficulty',
          // _id: "null",  grouping all the documents together
          // _id: '$difficulty', //grouping by difficulty
          // _id: { $toUpper: '$difficulty' }, //grouping by difficulty and converting to uppercase
          // _id: '$ratingsAverage', //grouping by ratingsAverage and so on
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, // sorting by average price in ascending order
      },
      // we can also use the $match stage to exclude some documents from the result
      // the first match before group and the other after group
      // {
      //  $match: { _id: { $ne: 'EASY' } }, //excluding the easy difficulty tours
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      { $unwind: '$startDates' }, // deconstructing the array of startDates to one document per date
      // so if a tour has 3 start dates, it will be 3 documents in the pipeline
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, // grouping by month
          numTourStarts: { $sum: 1 }, // summing the number of tour starts

          tours: { $push: '$name' }, // pushing the tour names to an array
        },
      },
      {
        $addFields: { month: '$_id' }, // adding a new field month
      },
      {
        $project: {
          _id: 0, // excluding the _id field
        },
      },
      {
        $sort: { numTourStarts: -1 }, // sorting by number of tour starts in descending order
      },
      {
        $limit: 12, // limiting to 12 results
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: { plan },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
