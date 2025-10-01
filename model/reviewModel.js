const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review cannot be empty.'] },
    rating: {
      type: Number,
      max: [5, 'ratings must not be more than 5.0'],
      min: [1, 'rating must be at least 1.0'],
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// pre middleware pointing to the current query
// this keyword in a query middleware points to the current query
// we are using regex to match all the methods that start with find
// so it will work for find, findOne, findById, findOneAndUpdate, findOneAndDelete etc

reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'user', select: 'name photo' }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({ path: 'user', select: 'name photo' });

  next();
});

// to prevent duplicate reviews from the same user on the same tour
// how index works, it creates a unique combination of tour and user
// so if a user tries to create a review for the same tour again, it will throw an error
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// static method to calculate average ratings and quantity of ratings for a tour
// how statics works, it is a method that is called on the model itself
// while methods are called on the document

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the current model
  // this.aggregate() is a mongoose method that performs aggregation operations on the model
  // aggregation operations are used to perform complex data analysis and transformations on the data
  // it returns a promise that resolves to the result of the aggregation operation
  // this keyword in a static method points to the model itself
  // tourId is the id of the tour for which we want to calculate the average ratings
  // we are using aggregation pipeline to calculate the average ratings and quantity of ratings for a tour
  // aggregation pipeline is a series of stages that process the data and return the result
  // each stage performs a specific operation on the data
  // $match stage filters the documents that match the specified condition
  // $group stage groups the documents by the specified field and performs the specified operations on the grouped documents
  // $sum operator calculates the sum of the specified field
  // $avg operator calculates the average of the specified field
  // the result of the aggregation operation is an array of documents
  // each document contains the _id field which is the value of the field by which we grouped the documents
  // and the other fields which are the result of the operations performed on the grouped documents
  // in our case, we are grouping the reviews by the tour field and calculating the number of ratings and average rating for each tour
  // so the result will be an array of documents, each document will contain the tour id, number of ratings and average rating for that tour
  // we are using the tourId parameter to filter the reviews for the specific tour
  // so the result will be an array with a single document containing the tour id, number of ratings and average rating for that tour
  // if there are no reviews for the tour, the result will be an empty array
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  // we need to update the tour document with the calculated average ratings and quantity of ratings
  // we can use the Tour model to update the tour document
  // but we cannot require the Tour model here because it will create a circular dependency
  // so we can use mongoose.model() to get the Tour model
  // mongoose.model() is a mongoose method that returns the model with the specified name
  // we need to check if there are any reviews for the tour
  // if there are no reviews, we need to set the ratingsQuantity to 0 and ratingsAverage to 4.5
  // if there are reviews, we need to set the ratingsQuantity and ratingsAverage to the calculated values
  // stats is an array, if there are no reviews for the tour, it will be an empty array
  // so we need to check if the array is not empty before accessing the first element
  // stats[0] will contain the calculated values
  // stats[0].nRating is the number of ratings
  // stats[0].avgRating is the average rating
  // we are using await because findByIdAndUpdate() returns a promise and we need to wait for the promise to resolve before moving to the next line of code
  if (stats.length > 0) {
    await mongoose.model('Tour').findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await mongoose.model('Tour').findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// pre middleware pointing to the current query
// post middleware pointing to the current document
// this keyword in a post middleware points to the current document
// we are using post middleware because we need to calculate the average ratings and quantity of ratings after the review is saved to the database
// so that the new review is included in the calculation

reviewSchema.post('save', function (next) {
  // this points to the current document
  // we cannot use an arrow function here because arrow functions do not have their own this keyword
  // so this keyword will point to the global object and not the current document
  // constr
  this.constructor.calcAverageRatings(this.tour);
  // this.constructor points to the model that created the document
  // this.tour is the tour id for which the review is created
  // this.tour is id of the tour because in the reviewSchema we have defined the tour field as a reference to the Tour model through its ObjectId
  next();
});

// to set the current review document to this.r
// so that we can access it in the post middleware
// we need the document to get the tour id for which the review is created
// so that we can calculate the average ratings and quantity of ratings for that tour
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to the current query

  this.r = await this.findOne();
  // we are storing the document in the current query object
  // because in post middleware, the query has already executed
  // so we cannot access the document in the post middleware
  // we need the document to get the tour id for which the review is created
  // so that we can calculate the average ratings and quantity of ratings for that tour
  next();
});

// to calculate the average ratings and quantity of ratings when a review is updated or deleted
// findByIdAndUpdate and findByIdAndDelete are shorthand for findOneAndUpdate and findOneAndDelete
// so we can use pre and post middleware for findOneAndUpdate
reviewSchema.post(/^findOneAnd/, async function () {
  // this points to the current query
  // we are using await because calcAverageRatings() returns a promise
  await this.r.constructor.calcAverageRatings(this.r.tour);
  // this.r.constructor points to the model that created the document
  // this.r.tour is the tour id for which the review is created
  // this.r.tour is id of the tour because in the reviewSchema we have defined the tour field as a reference to the Tour model through its ObjectId
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
