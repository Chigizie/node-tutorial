const express = require('express');
const {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controller/tourController');
const { protect, restrictTo } = require('../controller/authController');

const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// this is a way to mount a router on a specific path
// so that when a request is made to that path, the router will handle it
// this is also called nested routes
// we are using this to handle the reviews for a specific tour
// for example, when a request is made to /api/v1/tours/12345/reviews
// the reviewRouter will handle the request
// we are using mergeParams: true in the reviewRoutes.js file to get access to the tourId parameter
// in the reviewController.js file when creating a review for a specific tour
router.use('/:tourId/reviews', reviewRouter); // mergeParams: true in reviewRoutes.js

// router.param('id', checkID);

// reading data from a file
// const tour = fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8');

// sending to the client when a rquest is made to the sever on the endpoint /api/v1/turs

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/top-5-cheap').get(aliasTopTour, getAllTours); // middleware function this will run before the getAllTours function and it will modify the req.query object to limit the results to 5 and sort them by price and ratingsAverage and then call the next function which is getAllTours

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/')

  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
