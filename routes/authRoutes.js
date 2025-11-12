const express = require('express');
const path = require('path');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', (req, res) => {
  res.render('login', { user: req.session.userId });
});

router.post('/login', userController.login);

router.get('/register', (req, res) => {
  res.render('register', { user: req.session.userId });
});

router.post('/register', userController.register);

router.post('/logout', userController.logout);

module.exports = router;
