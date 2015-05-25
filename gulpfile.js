'use strict';

var gulp = require('gulp'),
    env = process.env.NODE_ENV || 'development';
// read gulp directory contents for the tasks...
require('require-dir')('./gulp');
console.log('Invoking gulp -',env);
