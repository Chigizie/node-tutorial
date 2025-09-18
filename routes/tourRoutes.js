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
} = require('../controller/tourController');
const { protect, restrictTo } = require('../controller/authController');

const router = express.Router();

// router.param('id', checkID);

// reading data from a file
// const tour = fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8');

// sending to the client when a rquest is made to the sever on the endpoint /api/v1/turs
// 5
router.route('/top-5-cheap').get(aliasTopTour, getAllTours); // middleware function this will run before the getAllTours function and it will modify the req.query object to limit the results to 5 and sort them by price and ratingsAverage and then call the next function which is getAllTours

router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(protect, getAllTours).post(createTour);

router
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
