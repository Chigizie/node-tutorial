const express = require('express');

const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
} = require('../controller/userController');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
} = require('../controller/authController');
// USERS
// app.route('/api/v1/users').get(getAllUsers).post(createUser);

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.patch('/updateMyPassword', protect, updatePassword);

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);

module.exports = router;
