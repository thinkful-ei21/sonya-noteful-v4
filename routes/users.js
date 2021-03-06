'use strict';

const express = require('express');

const User = require('../models/user');

const router = express.Router();

//post endpoint to insert new  users
router.post('/', (req, res, next) => {
  console.log(req.body);
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next(err);
  }

  const stringFields = ['username', 'password', 'fullname'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field]!== 'string'
  );

  if (nonStringField) {
    const err = new Error(`The '${nonStringField}' must be a string`);
    err.status = 422;
    return next(err);
  }

  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with whitespace`);
    err.status = 422;
    return next(err);
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };

  const tooSmallField = Object.keys(sizedFields).find(
    field => 
      'min' in sizedFields[field] &&
        req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(sizedFields).find(
    field => 
      'max' in sizedFields[field] &&
        req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField) {
    const min = sizedFields[tooSmallField].min;
    const err = new Error(`Field: '${tooSmallField}' must be at least ${min} characters long`);
    err.status = 422;
    return next(err);
  }

  if (tooLargeField) {
    const max = sizedFields[tooLargeField].max;
    const err = new Error(`Field: '${tooLargeField}' must be at most ${max} characters long`);
    err.status = 422;
    return next(err);
  }

  let {username, password, fullname = ''} = req.body;

  fullname = fullname.trim();

  return User.find({username})
    .count()
    .then(count => {
      if(count > 0) {
        //there is an existing user with the same username
        return Promise.reject({
          status: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(digest => {
      const newUser = {
        username, 
        password: digest,
        fullname
      };
      return User.create(newUser);
    })
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      if (err.code === 1100) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});
   
module.exports = router;
  

 