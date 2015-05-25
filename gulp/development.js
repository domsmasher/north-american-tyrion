'use strict';

var gulp = require('gulp'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  through = require('through'),
  gutil = require('gulp-util'),
  plugins = gulpLoadPlugins(),
  cachebust = new plugins.cachebust(),
  express = require('express'),
  browserSync = require('browser-sync'),
  minimist = require('minimist'),
  runSequence = require('run-sequence'),
  options = minimist(process.argv),
  enviroment = options.enviroment || 'development',
  server,
  paths = {
    js: ['*.js', 'test/**/*.js', '!test/coverage/**', '!bower_components/**', 'packages/**/*.js', '!packages/**/node_modules/**', '!packages/contrib/**/*.js', '!packages/contrib/**/node_modules/**'],
    html: ['src/html/**/*.html'],
    images: ['src/images/**/*.{png,jpg}'],
    css: ['!bower_components/**', 'src/styles/**/*.css'],
    stylus: ['src/stylus/*.styl']
  };

var rename = function () {
  return plugins.rename(function (path) {
    path.dirname = '';
  });
};

var reload = function () {
  if (server) {
    return browserSync.reload({stream: true});
  } 

  return gutil.noop();
};

gulp.task('html', function () {
  return gulp.src(paths.html)
    .pipe(cachebust.references())
    .pipe(gulp.dest('dist'))
    .pipe(reload());
});

gulp.task('images', function () {
  return gulp.src(paths.images)
    .pipe(plugins.imagemin())
    .pipe(cachebust.resources())
    .pipe(gulp.dest('dist/images'))
    .pipe(reload());
});

gulp.task('styles', function () {
  return gulp
    .src(paths.stylus)
    .pipe(plugins.stylus())
    //.pipe(enviroment === 'production'? plugins.minifyCss() : gutil.noop())
    .pipe(gulp.dest('src/styles'))
    .pipe(reload());
});

gulp.task('scripts', function () {});

gulp.task('server', function () {
  server = express();
  server.use(express.static('dist'));
  server.listen(5000);
  browserSync({proxy: 'localhost:5000'});
});

gulp.task('build', function(done) { 
  runSequence('images', 'styles', 'scripts','autoprefixer',  'html', done);
});

gulp.task('autoprefixer', function () {
  return gulp.src(paths.css)
    .pipe(plugins.autoprefixer())
    .pipe(plugins.uncss({html: 'dist/index.html'}))
    .pipe(plugins.csso())
    .pipe(cachebust.resources())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('jshint', function () {
  return gulp.src(paths.js)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'))
    .pipe(count('jshint', 'files lint free'));
});

gulp.task('csslint', function () {
  return gulp.src(paths.css)
    .pipe(plugins.csslint('.csslintrc'))
    .pipe(plugins.csslint.reporter())
    .pipe(count('csslint', 'files lint free'));
});

gulp.task('watch', function () {
  gulp.watch(paths.js, ['jshint']);
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.css, ['autoprefixer', 'csslint']);
  gulp.watch(paths.stylus, ['styles']);
});

gulp.task('default', ['build', 'watch', 'server']);

function count(taskName, message) {
  var fileCount = 0;

  function countFiles(file) {
    fileCount++; // jshint ignore:line
  }

  function endStream() {
    gutil.log(gutil.colors.cyan(taskName + ': ') + fileCount + ' ' + message || 'files processed.');
    this.emit('end'); // jshint ignore:line
  }
  return through(countFiles, endStream);
}

