const Tour = require('../model/tourmodel');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// exports.checkID = (req, res, next, val) => {
//   const id = Number(req.params.id);

//   if (id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(req.body.name);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'Failed',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

exports.getAllTours = async (req, res) => {
  try {
    // getting all the tours from the database
    const tours = await Tour.find(); // to get all the tours from the database

    // Filtering;
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);

    // 1)
    // filtering with destructuring, rest operator and renaming
    // to exclude page, sort, limit and fields from queryObj it gives exactly the same result as above code
    //  but in a cleaner way
    const { page, sort, limit, fields, ...queryObj } = req.query;

    // Advanced filtering
    // to convert queryObj to a string and use regular expression to replace gte, gt, lte, lt with $gte, $gt, $lte, $lt for mongoose to understand, we do the following. eg for price[gte]=500 needto convert it to price: {$gte: 500} for mongoose to understand

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // WE BUILD THE QUERY
    // const query = Tour.find(queryObj); // simple filtering
    let query = Tour.find(JSON.parse(queryStr)); // advanced filtering

    // 2)
    // SORTING
    // eg sort=price or sort=price,ratingsAverage
    // Sorting in descending order eg sort=-price or sort=-price,ratingsAverage

    // SORTING WITH ONE CRITERIA
    if (sort) {
      query = query.sort(req.query.sort);
    }

    // SORTING WITH MULTIPLE CRITERIA
    if (sort) {
      query = query.sort(sort.split(',').join(' '));
    } else {
      // default sorting sorting by createdAt in descending order
      query = query.sort('-createdAt');
    }
    // 3)
    // FIELD LIMITING
    // if the user only wants some fields  eg  fields=name,duration,difficulty,price

    if (fields) {
      // this is how what the user will type in broser looks like  fields=name,duration,difficulty,price
      // as mongoose requires space between field names we need to replace the comma with space

      // sellecting specific fields is called projecting in mongoose
      // assuming the only one fiels the code will look this way query = query.select(fields);
      // but if there are multiple fields we need to replace the comma with space
      query = query.select(fields.split(',').join(' '));
    } else {
      // by default we exclude the __v field that is created by mongoose
      // __v is the version key that is used to track document revisions in MongoDB. It is automatically added to each document by Mongoose and can be remove prefixing "-" to it.
      query.select('-__v');
    }

    // 4)
    // PAGINATION
    // eg page=2&limit=10  means page 1 will have 1-10, page 2 will have 11-20 and so on

    const pageNum = page * 1 || 1; // converting to number
    const limitNum = limit * 1 || 100; // converting to number
    const skip = (pageNum - 1) * limitNum;
    // query = query.skip(skip).limit(limitNum);
    // if the user requests a page that does not exist
    if (req.query.page) {
      // if page is specified in the query
      const numTours = await Tour.countDocuments(); // countDocuments() is a mongoose method that counts the number of documents in a collection
      if (skip >= numTours) {
        // if skip is greater than or equal to the number of documents in the collection
        throw new Error('This page does not exist'); // throwing an error that will be caught in the catch block below
      }
    }
    // when we use "await" it automatically executes the query and returns the result and we cannot chain more methods to it like sort, select etc after it. So we need to store the query in a variable without "await" and then we can chain more methods to it before finally executing it with "await".

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
