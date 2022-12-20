const User = require('../models/User');
const Exercise = require('../models/Exercise');
const { BadRequestError } = require('../errors');

function prettifyDate(date) {
  return date.toDateString();
}

const createUser = async (req, res) => {
  const { username } = req.body;
  const userExists = await User.find({ username });
  if (userExists.length === 1) {
    throw new BadRequestError('User already exists');
  }
  const user = await User.create({ username });
  return res.status(200).json({ username: user.username, _id: user._id });
};

const getAllUsers = async (req, res) => {
  const allUsers = await User.find({}).select('username _id');
  if (allUsers.length === 0) {
    throw new BadRequestError('No users exist');
  }
  return res.status(200).json(allUsers);
};

const createUserExercise = async (req, res) => {
  // destructuring. userId is alias
  let { _id: userId, description, duration, date } = req.body;
  duration = Number(duration);
  // simplistic validation for Date. A Date validation library could do better...
  if (date === '' || !date) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  const exerciseExist = await Exercise.find({ user: userId, description, duration });
  if (exerciseExist.length === 1) {
    throw new BadRequestError('Exercise already exists');
  }

  const exercise = await Exercise.create({ user: userId, description, duration, date });
  // destructuring. exerciseId is alias
  const { _id: exerciseId } = exercise;

  let user = await User.findByIdAndUpdate(
    userId,
    { exercise: exerciseId },
    { new: true, runValidators: true },
  );
  if (!user) {
    // these two statements are not doing anything because this is a 'cast error' and the 'error-handler' middleware steps in to handle it.
    // It gets handled in the end and that is what matters
    const removeExercise = await Exercise.findByIdAndRemove({ exerciseId });
    throw new BadRequestError(`No user with _id ${userId} exists`);
  }

  const userObj = await User.findById(userId).populate('exercise');

  return res.status(200).json({
    username: userObj.username,
    description: userObj.exercise.description,
    duration: userObj.exercise.duration,
    date: userObj.exercise.date.toDateString(),
    _id: userObj._id,
  });
};

const getUserLogs = async (req, res) => {
  const { _id: userId } = req.params;
  //console.log('req.query = ', req.query);
  let { from, to, limit } = req.query;

  //*** setting some default values for 'from', 'to' and 'limit'
  //** Note : We can do better validation for 'from', 'to', 'limit' then this ...

  // if `from` is not provided or empty string then make `from` the date '2000-1-1'
  from ? (from = new Date(from)) : (from = new Date('2000-1-1'));

  // if `to` is not provided or empty string then make `to` the current date
  to ? (to = new Date(to)) : (to = new Date());

  // if `limit` is not provided or empty string then make `limit` equal to integer 0. This makes mongoDB return all the exercises.
  limit ? (limit = Number(limit)) : (limit = 0);

  const user = await User.findById(userId);
  if (user === null || !user) {
    throw new BadRequestError(`No user with _id ${userId} exists.`);
  }

  let exercises = await Exercise.find({ user: userId })
    .where('date')
    .gte(from)
    .lte(to)
    .select({
      description: 1,
      duration: 1,
      date: 1,
      _id: 0,
    })
    .limit(limit);
  if (exercises.length === 0 || !exercises) {
    throw new BadRequestError('User has not added any exercises');
  }
  const count = exercises.length;
  const { username, _id } = user;

  let prettyExercises = exercises.map((exercise) => {
    let { description, duration, date } = exercise;
    date = date.toDateString();
    return { description, duration, date };
  });

  return res.status(200).json({ username, count, _id, log: [...prettyExercises] });
};

module.exports = { getAllUsers, createUser, createUserExercise, getUserLogs };
