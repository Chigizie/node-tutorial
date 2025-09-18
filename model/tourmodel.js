const mongoose = require('mongoose');
const slugify = require('slugify');
// tour schema and model
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [50, 'A tour name must have less or equal to 50 characters'],
      minlength: [11, 'A tour name must have at least 10 characters'],
      // maxlength and minlength only work for strings
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: ' Difficulty is either: easy, medium, difficult',
      }, // enum only works for strings and it only works for required fields, it makes sure that the value of the field is one of the values in the array
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below or equal to 5.0'],
      // min and max only work for numbers and dates
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,
      // this below is a custom validator, it only works on create and save not on update
      validate: {
        validator: function (val) {
          // the function has access to value being put in by user and this is what it receives as val argument
          // this only points to current doc on NEW document creation
          return val < this.price; // priceDiscount should be less than price
        },
        message: 'Discount price ({VALUE}) should be below regular price', // {VALUE} will be replaced by the value of the priceDiscount field
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },

    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String], // array of strings

    createdAt: {
      type: Date,
      default: Date.now(),
      // setting select to false will hide this field from the output when we query the database.
      select: false, // it will still be stored in the database but it will not be sent to the client
    },
    startDates: [Date],
    secreteTour: {
      type: Boolean,
      default: false,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// virtual property durationWeeks that will be calculated from duration field
// it will not be stored in the database but will be available when we query the database
// we use function() instead of arrow function because we need to use this keyword
// this keyword points to the current document which is the document that is being processed in this case the tour document.

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// middlewares, there are 4 types of middlewares in mongoose
// document middlewares, query middlewares, aggregate middlewares, model middlewares

// DOCUMENT MIDDLEWARE,
//  it runs before .save() and .create() but not on .insertMany() or .update()
// we use function() instead of arrow function because we need to use this keyword
// 1) document middleware. it is of two types pre and post
// pre middleware runs before the event and post middleware runs after the event, in this case the event is save or create

tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  // this keyword points to the current document which is the document that is being saved or created

  next();
});

// we can have multiple pre middlewares for the same event, they will run in the order they are defined

// tourSchema.pre('save', function (next) {
//   console.log('will save run before saving the document...');
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
//  it runs before and after any query that starts with find, like find, findOne, findById, findOneAndUpdate, findOneAnddelete etc.

// we use function() instead of arrow function because we need to use this keyword
// this keyword in this case points to the current query object and not the document

tourSchema.pre(/^find/, function (next) {
  this.find({ secreteTour: { $ne: true } });
  // tourSchema.pre('find', function (next) {
  // this will exclude all the documents that have secreteTour field set to true from the output of any find query

  // so if we do tour.find() it will exclude all the secrete tours from the output
  // we can also use regex to match all the queries that start with find like find, findOne, findById, findOneAndUpdate, findOneAnddelete etc.
  // eg tourSchema.pre(/^find/, function() {
  //  this.find({secreteTour: {$ne: true}}
  // })
  // this will exclude all the secrete tours from the output of any query that starts with find
  next();
});

tourSchema.post(/^find/, (docs, next) => {
  // console.log(docs);
  next();
});

// AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // console.log(this.pipeline()); // this keyword points to the current aggregation object
  // this.pipeline() returns the array of aggregation stages
  // we can use this to modify the aggregation pipeline
  this.pipeline().unshift({ $match: { secreteTour: { $ne: true } } }); // adding a new stage to the beginning of the pipeline to exclude secrete tours
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
