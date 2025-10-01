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
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // this is how we reference another model in mongoose with ObjectId type
        // here we are referencing the User model
        // this will allow us to populate the guides field with the user documents
      },
    ],

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
      set: (val) => Math.round(val * 10) / 10, // eg if val is 4.6666666 it will be rounded to 4.7, this is called a setter, it runs whenever the value of the field is set or updated, it receives the value that is being set or updated as an argument
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

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    // locations is an array of objects
    // to implement geospatial data we need to use GeoJSON format
    // GeoJSON is a format for encoding a variety of geographic data structures
    // GeoJSON supports the following geometry types: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, GeometryCollection
    // here we are using Point type
    // for more information on GeoJSON visit https://geojson.org/
    // we can have multiple locations for a tour
    // each location will have its own coordinates, address, description and day
    // day field is used to indicate on which day of the tour this location will be visited
    // we will use this locations field to implement the tour itinerary
    // we will also use this field to implement the tour map
    // we will use this field to implement the tour locations on the map

    locations: [
      // this is called embedding in mongoose
      // we are embedding the location schema inside the tour schema
      // it is always an array of objects
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [],
        address: String,
        description: String,
        day: Number,
      },
    ],
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

// VIRTUAL POPULATE
// this is used to populate the reviews for a tour
// we are not storing the reviews in the tour document but we can still get the reviews for a tour
// when we query the tour document we can populate the reviews for that tour
tourSchema.virtual('reviews', {
  ref: 'Review', // the model to use
  foreignField: 'tour', // the field in the review model that references the tour model
  localField: '_id', // the field in the tour model that is referenced in the review model
});

// INDEXES
// to improve the performance of the queries
// we can create indexes on the fields that we are going to use often in the queries
// eg if we are going to query often price and ratingsAverage fields in the queries we can create an index on those fields
// this will improve the performance of the queries
// we can create single field index or compound index
// single field index is created on a single field
// compound index is created on multiple fields
// we can also create text index for text search
// for more information on indexes visit https://docs.mongodb.com/manual/indexes/

tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index, 1 for ascending order and -1 for descending order
tourSchema.index({ slug: 1 }); // single field index

tourSchema.index({ startLocation: '2dsphere' }); // to create geospatial index for startLocation field, this is required for geospatial queries.

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

tourSchema.pre(/^find/, function (next) {
  // populate() is a mongoose method that populates the referenced documents in the guides field
  // it takes the name of the field that we want to populate as a parameter
  // here we are populating the guides field with the user documents
  // so the guides field will contain the user documents instead of the user ids
  // we can also populate multiple fields by chaining the populate() method
  // .populate('guides').populate('anotherField')
  // we can also select specific fields to populate by passing an object as a parameter to the populate() method
  // .populate({ path: 'guides', select: 'name photo' })
  // this will only populate the name and photo fields of the user documents
  // if we want to exclude some fields, we can use the minus sign before the field
  // .populate({ path: 'guides', select: '-__v -passwordChangedAt' })
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, (docs, next) => {
  // console.log(docs);
  next();
});

// AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // console.log(this.pipeline()); // this keyword points to the current aggregation object
//   // this.pipeline() returns the array of aggregation stages
//   // we can use this to modify the aggregation pipeline

//   this.pipeline().unshift({ $match: { secreteTour: { $ne: true } } }); // adding a new stage to the beginning of the pipeline to exclude secrete tours

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
