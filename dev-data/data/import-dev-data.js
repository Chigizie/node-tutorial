// Script to import or delete data from the database

const fs = require('fs');
const mongoose = require('mongoose');

const dotenv = require('dotenv');
const Tour = require('../../model/tourmodel');
const Review = require('../../model/reviewModel');
const User = require('../../model/userModel');

dotenv.config({ path: './config.env' });

// Connect to MongoDB using Mongoose
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

// READING DATA

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);
// IMPORTING DATA
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); // to skip the validation of the passwordConfirm field
    await Review.create(reviews);

    console.log('data successfully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// DELETE ALL THE DATA FROM DB

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
  console.log('data successfully imported');
} else if (process.argv[2] === '--delete') {
  deleteData();
  console.log('data successfully deleted');
}
// process.argv is an array that contains the command line arguments passed when we run the script
// console.log(process.argv);
// argv is a global variable that is available in all Node.js modules
// eg if we console.log(process.argv) and run the script using node ./dev-data/data/import-dev-data.js --import
// we will get an array like this
// [
//   '/usr/local/bin/node',
//   '/Users/username/Desktop/project/dev-data/data/import-dev-data.js',
//   '--import'
// ]

// eg node ./dev-data/data/import-dev-data.js --import
// eg node ./dev-data/data/import-dev-data.js --delete
// process.argv[0] is the path to the node executable
// process.argv[1] is the path to the script
// process.argv[2] is the first argument passed to the script, in this case --import or --delete
