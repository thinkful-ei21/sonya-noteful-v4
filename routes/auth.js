'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {JWT_SECRET, JWT_EXPIRY} = require('../config');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

function createAuthToken (user) {
  console.log(JWT_SECRET, 'auth.js');
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;