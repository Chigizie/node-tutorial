// Script to import or delete data from the database

const fs = require('fs');
const mongoose = require('mongoose');

const dotenv = require('dotenv');
const Tour = require('../../model/tourmodel');

dotenv.config({ path: './config.env' });

// Connect to MongoDB using Mongoose
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

// READING DATA

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

// IMPORTING DATA
const importData = async () => {
  try {
    await Tour.create(tours);

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
  process.exit();
}
