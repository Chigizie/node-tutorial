// const fs = require('fs');

const Tour = require('../model/tourmodel');

// const ApiFeatures = require('../utils/apiFeatures');
const {
  deleteOne,
  createOne,
  updateOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,prrice';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}; // middleware function to preset the query parameters for top 5 cheap tours endpoint,

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

exports.getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // we need to convert the distance to radians because the $geoWithin operator requires the radius to be in radians

    // radius of the earth in miles = 3963.2
    // radius of the earth in kilometers = 6378.1
    // we need to convert the distance to radians
    // radians = distance / radius of the earth
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if (!lat || !lng) {
      next(
        new Error(
          'Please provide latitude and longitude in the format lat,lng',
        ),
      );
    }

    const tours = await Tour.find({
      // $geoWithin is a mongoose method that finds documents within a certain geometry
      // $centerSphere is a geojson object that defines a circle
      // the first parameter is the center of the circle [lng, lat]
      // the second parameter is the radius of the circle in radians
      // to convert distance to radians, we divide the distance by the radius of the earth
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
      // very important is before we start querying the database, we need to make sure that we have a geospatial index on the startLocation field in the tour model
      // mongodb expects that in field that we are using for geospatial queries, in this case startLocation, there is a geospatial index, 2dsphere index if  we are working with a real place on earth, and 2d index if we are working with a fictional place.
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng) {
      next(
        new Error(
          'Please provide latitude and longitude in the format lat,lng',
          400,
        ),
      );
    }
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // to convert meters to miles or kilometers

    // we are using the aggregate method to calculate the distances
    // aggregate method is used to perform aggregation operations on the documents in a collection
    // aggregate method takes an array of stages as a parameter
    // aggegate method always returns an array
    // aggregate must always be called on the model, not on the document
    // so we are calling it on the Tour model
    // we are using the geoNear stage to calculate the distances
    // geoNear stage must be the first stage in the pipeline
    // geoNear stage requires at least one of the fields in the documents to have a geospatial index
    // we have created a geospatial index on the startLocation field in the tour model
    // if there are many geospatial indexes, we can specify which index to use with the key field
    // key field is the field that has the geospatial index
    // eg: key: 'startLocation' then it will use the geospatial index on the startLocation field

    // if we do not specify the key field, mongoose will use the first geospatial index
    // geoNear stage requires the near field which is the point from which to calculate the distances
    // near field must be a geojson object with type and coordinates fields
    // coordinates field must be an array with longitude and latitude
    // geoNear stage requires the distanceField which is the field in which to store the calculated distances
    // geoNear stage can also take the distanceMultiplier which is used to multiply the calculated distances
    // we are using the distanceMultiplier to convert the distances from meters to miles or kilometers
    // we are using the $project stage to select only the fields that we want to return
    // in this case, we want to return only the distance and name fields
    const distances = await Tour.aggregate([
      {
        // geoNear calculates the distance between the specified point and the points in the documents
        // and adds a distance field to each document
        // the distance field contains the calculated distance
        // the distance is in meters by default
        // we can use the distanceMultiplier to convert the distance to miles or kilometers
        // geoNear always has to be the first stage in the pipeline
        // geoNear requires at least one of the fields in the documents to have a geospatial index
        // we have created a geospatial index on the startLocation field in the tour model

        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1], // we need to convert the strings to numbers
          },
          distanceField: 'distance', // the field that will be added to each document that contains the calculated distance
          distanceMultiplier: multiplier, // to convert the distance from meters to miles or kilometers
        },
      },
      {
        // $project is used to select only the fields that we want to return
        // $project to select only the fields that we want to return
        // in this case, we want to return only the distance and name fields
        // setting distance: 1 means that we want to include the distance field
        // setting name: 1 means that we want to include the name field
        // setting _id: 0 means that we want to exclude the _id field

        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getAllTours = getAll(Tour);

exports.getTourById = getOne(Tour, 'reviews');

exports.createTour = createOne(Tour);

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);
