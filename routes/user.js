const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  createUserExercise,
  getUserLogs,
  handleLogsResponse,
} = require('../controllers/user');

router.get('/', getAllUsers);
router.post('/', createUser);
router.post('/:id/exercises', createUserExercise);
router.get('/:_id/logs', getUserLogs, handleLogsResponse);

module.exports = router;
