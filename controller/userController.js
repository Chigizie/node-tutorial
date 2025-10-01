const User = require('../model/userModel');
const appError = require('../utils/appError');
const { deleteOne, updateOne, createOne, getOne } = require('./handlerFactory');

exports.getAllUsers = async (req, res, next) => {
  try {
    const user = await User.find();

    res.status(200).json({
      results: user.length,
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// Middleware to get the logged in user's data, it will set the id in the params to the logged in user's id
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res, next) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.confirmPassword) {
      return next(
        appError(
          'This route is not for password updates. Please use /updateMyPassword',
          400,
        ),
      );
    }

    // 2) Update user document
    // We use findByIdAndUpdate because we are not updating password here
    // We are just updating name and email
    // So, we don't need to run the pre 'save' middleware that hashes the password
    // We also set new: true to return the updated document
    // We also set runValidators: true to run the validators on the updated fields
    // This is important because if we don't set this, the validators will not run
    // and we might end up with invalid data in the database
    // For example, if we update the email to an invalid email, it will not be caught
    // if we don't set runValidators: true
    // So, always set runValidators: true when using findByIdAndUpdate
    // to update user data
    // Note: We are using req.user.id because the protect middleware adds the user
    // to the req object after verifying the token
    // So, we can access the user id from req.user.id
    // This is better than getting the id from req.params.id because
    // we want to update the logged in user only
    // and not any user by id
    // This is a security measure to prevent users from updating
    // other users' data
    // Always use req.user.id for updating the logged in user's data
    // and not req.params.id
    // This way, we ensure that users can only update their own data
    // and not other users' data
    // This is a common security practice in web applications
    // to prevent unauthorized access to other users' data

    const filteredBody = (obj, ...allowedFields) => {
      const newObj = {};
      Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
      });
      return newObj;
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody(req.body, 'name', 'email'),
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false }); // active is a field in the user model that we will use to soft delete the user

    res.sendStatus(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    return next(appError('Error deleting user', 500));
  }
};

exports.getUserById = getOne(User);
// (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined, please use /signup instead',
  });
};
exports.updateUser = updateOne(User);

exports.deleteUser = deleteOne(User);
