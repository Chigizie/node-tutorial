const express = require('express');

const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controller/userController');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  restrictTo,
} = require('../controller/authController');
// USERS
// app.route('/api/v1/users').get(getAllUsers).post(createUser);

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect); // all the routes after this middleware will be protected
// only logged in users can access the routes after this middleware
// to protect the routes after this middleware we will use the protect middleware from the authController.js
// it is possible because the middleware will run before the route handler and it will check if the user is logged in or not
// if the user is not logged in it will return an error
// if the user is logged in it will call the next middleware or the route handler
router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getUserById); // to get the logged in user's data, the getMe middleware will set the id in the params to the logged in user's id and then call the getUserById controller to get the user's data. by doing this the id parameter that came from params in the getUserById will be replaced with the logged in user's id by the getMe middleware

router.use(restrictTo('admin')); // only admin can access the routes after this middleware
// to restrict the routes after this middleware to only admin we will use the restrictTo middleware from the authController.js
// it is possible because the middleware will run before the route handler and it will check if the user is admin or not
// if the user is not admin it will return an error
// if the user is admin it will call the next middleware or the route handler
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);

module.exports = router;
