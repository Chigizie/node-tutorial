const mongoose = require('mongoose');

const app = require('./app');
// const dotenv = require('dotenv');
// dotenv.config({ path: './config.env' });

// Connect to MongoDB using Mongoose
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

// the server listens on port 3000
// and logs a message to the console when it starts
const port = 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
