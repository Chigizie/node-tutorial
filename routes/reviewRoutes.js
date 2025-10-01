const express = require('express');

// const router = express.Router();
// to get access to the params from the parent router
// eg in the tourRoutes.js file we have a route /:tourId/reviews
// so we need to get access to the tourId parameter in the reviewRoutes.js file
const router = express.Router({ mergeParams: true }); // to get access to the params from the parent router

const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('../controller/reviewController');

const { protect, restrictTo } = require('../controller/authController');

router.use(protect);

router
  .route('/')
  .post(restrictTo('user'), setTourUserIds, createReview)
  .get(getAllReviews);

router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

module.exports = router;
