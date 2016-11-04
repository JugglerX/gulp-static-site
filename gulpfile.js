'use strict';

var del = require('del');
var fs = require('fs');
var gulp = require('gulp');
var data = require('gulp-data');
var frontMatter = require('gulp-front-matter');
var yaml = require('js-yaml');
var hb = require('gulp-hb');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;


// ----------------------------------------------------------------

gulp.task('html', function () {
    return gulp
       .src('./site/**/*.html')

       .pipe(frontMatter({ 
          property: 'meta', 
          remove: true
        }))

        .pipe(data(function(file) {
          console.log(file.meta);
        }))

        .pipe(data(function(file) {
          return require(file.path.replace('.html', '.json'));
        }))

         .pipe(data(function(file) {
            console.log(file.data);
        }))

        .pipe(hb()
          .partials('./src/partials/**/*.{hbs,js}')
          .helpers(require('handlebars-layouts'))
          .helpers('./src/helpers/**/*.js')
          .data('./src/data/**/*.{js,json}')
          .data({
            lorem: 'dolor',
            ipsum: 'sit amet'
          })
          .data({
            site: yaml.safeLoad(fs.readFileSync('./site.yml', 'utf8'))
          })
        )

        .pipe(gulp.dest('./web'));
});

// ----------------------------------------------------------------

gulp.task('js', function() {
  gulp.src('./src/js/**/*.js')
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./web/js'))
});

// ----------------------------------------------------------------

gulp.task('sass', function () {
  return gulp.src('./src/scss/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./web/css'));
});

// ----------------------------------------------------------------

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './web',
      open: 'external'
    }
  });
  gulp.watch(['./src/scss/**/*.scss'], ['sass']);
  gulp.watch(['./src/js/*.js'], ['js']);
  gulp.watch(['./src/**/*.hbs'], ['html']);
  gulp.watch(['./site/**/*.html'], ['html']);
  gulp.watch(['./web/{scss,css,js}/*.{scss,css,js}']).on('change', reload);
  gulp.watch(['./web/*.html']).on('change', reload);
});

// ----------------------------------------------------------------

gulp.task('cleanup', function(cb) {
  return del(['./web'], cb);
});

// ----------------------------------------------------------------

gulp.task('default', ['build'], function(cb) {
  runSequence(
    ['serve'],
    cb
  );
});

// ----------------------------------------------------------------
gulp.task('build', function (done) {
  runSequence('cleanup', 'html', 'js', 'sass', done);
});
