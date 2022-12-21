const Joi = require('joi').extend(require('@joi/date'));
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const { BadRequestError } = require('../errors');

// schema for joi. Need to validate 'from' and 'to'
const joiDateSchema = Joi.date().format([
  'YYYY-M-D',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'D-M-YYYY',
  'DD/MM/YYYY',
  'D/M/YYYY',
  'YYYY/MM/DD',
  'YYYY/M/D',
  'YYYY MM DD',
  'YYYY M D',
  'DD MM YYYY',
  'D M YYYY',
  'YYYY.MM.DD',
  'YYYY.M.D',
  'DD.MM.YYYY',
  'D.M.YYYY',
  'DD,MM,YYYY',
  'D,M,YYYY',
  'YYYY,MM,DD',
  'YYYY,M,D',
]);

const createUser = async (req, res) => {
  const { username } = req.body;
  //console.log('createUser\n', 'req.body = ', req.body);
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
  //console.log('createUserExercise\n', 'req.body = ', req.body, ' req.params = ', req.params);
  let { description, duration, date } = req.body;
  let { id: userId } = req.params;
  duration = Number(duration);
  // simplistic validation for Date. A Date validation library could do better...
  if (date === '' || !date) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  const exerciseExist = await Exercise.find({ user: userId, description, duration, date });
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
  /*
    if (!user) {
      // these two statements are not doing anything because this is a 'cast error' and the 'error-handler' middleware steps in to handle it.
      // It gets handled in the end and that is what matters
      const removeExercise = await Exercise.findByIdAndRemove({ exerciseId });
      throw new BadRequestError(`No user with _id ${userId} exists`);
    }
  */
  const userObj = await User.findById(userId).populate('exercise');

  return res.status(200).json({
    _id: userObj._id,
    username: userObj.username,
    date: userObj.exercise.date.toDateString(),
    duration: userObj.exercise.duration,
    description: userObj.exercise.description,
  });
};

const getUserLogs = async (req, res) => {
  //console.log('getUserLogs\n', 'req.params = ', req.params, ' req.query = ', req.query);
  const { _id: userId } = req.params;
  let { from, to } = req.query;
  let fromWasValid = true;
  let toWasValid = true;
  const limit = Number(req.query.limit) || 0;
  //console.log(joiDateSchema.validate(from));
  const fromIsValid = from && !joiDateSchema.validate(from).hasOwnProperty('error');
  if (!fromIsValid) {
    fromWasValid = false;
    from = new Date(0);
  }
  const toIsValid = to && !joiDateSchema.validate(to).hasOwnProperty('error');
  if (!toIsValid) {
    toWasValid = false;
    to = new Date(Date.now());
  }
  const user = await User.findById(userId);
  if (user === null || !user) {
    throw new BadRequestError(`No user with _id ${userId} exists.`);
  }
  //console.log('from = ', from, ' to = ', to, ' limit = ', limit);
  let exercises = await Exercise.find({
    user: userId,
    date: { $gte: from, $lte: to },
  })
    .select({
      description: 1,
      duration: 1,
      date: 1,
      _id: 0,
    })
    .limit(limit)
    .sort({ date: 'desc' });
  //console.log('exercises = ', exercises);

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

  let queries = Object.keys(req.query);

  if (
    queries.includes('from') &&
    fromWasValid &&
    queries.includes('to') &&
    toWasValid &&
    queries.includes('limit')
  ) {
    return res.status(200).json({
      _id,
      username,
      from: new Date(from).toDateString(),
      to: new Date(to).toDateString(),
      count,
      log: [...prettyExercises],
    });
  } else if (queries.includes('from') && fromWasValid && queries.includes('to') && toWasValid) {
    return res.status(200).json({
      _id,
      username,
      from: new Date(from).toDateString(),
      to: new Date(to).toDateString(),
      count,
      log: [...prettyExercises],
    });
  } else if (queries.includes('from') && fromWasValid && queries.includes('limit')) {
    return res.status(200).json({
      _id,
      username,
      from: new Date(from).toDateString(),
      count,
      log: [...prettyExercises],
    });
  } else if (queries.includes('to') && toWasValid && queries.includes('limit')) {
    return res
      .status(200)
      .json({ _id, username, to: new Date(to).toDateString(), count, log: [...prettyExercises] });
  } else if (queries.includes('from') && fromWasValid) {
    return res.status(200).json({
      _id,
      username,
      from: new Date(from).toDateString(),
      count,
      log: [...prettyExercises],
    });
  } else if (queries.includes('to') && toWasValid) {
    return res
      .status(200)
      .json({ _id, username, to: new Date(to).toDateString(), count, log: [...prettyExercises] });
  } else if (queries.includes('limit')) {
    return res.status(200).json({ _id, username, count, log: [...prettyExercises] });
  } else {
    return res.status(200).json({ _id, username, count, log: [...prettyExercises] });
  }
};

module.exports = { getAllUsers, createUser, createUserExercise, getUserLogs };
