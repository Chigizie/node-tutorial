const Review = require('../model/reviewModel');
// const appError = require('../utils/appError');
const { deleteOne, updateOne, createOne, getAll } = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // allow nested routes
  // if the tour and user ids are not in the body, we set them from the params and the logged in user
  // this is for when we create a review on the tour details page, we don't have to send the tour and user ids in the body
  // they will be set automatically from the params and the logged in user
  // this serves as a middleware function before the createReview function
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = createOne(Review);

exports.getAllReviews = getAll(Review);

exports.deleteReview = deleteOne(Review);

exports.updateReview = updateOne(Review);
