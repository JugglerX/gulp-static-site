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
var plumber = require('gulp-plumber');
var browserSync = require('browser-sync').create();
var faker = require('faker');
var markdownToJSON = require('gulp-markdown-to-json');
var marked = require('marked');
var changedInPlace = require('gulp-changed-in-place');
var rename = require('gulp-rename');
var matter = require('gray-matter');

// ----------------------------------------------------------------
gulp.task('markdown', () => {
  gulp.src('./site/**/*.md')
    .pipe(markdownToJSON(marked))
    .pipe(rename(function (path) {
      path.extname = ".md.json"
    }))
    .pipe(gulp.dest('./site'))
});

gulp.task('html', function () { 
    return gulp
       .src('./site/**/*.html')
        
       // Extract YAML front-matter and assign with gulp-data
        .pipe(data(function(file) {
            var m = matter(String(file.contents));
            file.contents = new Buffer(m.content);
            return m.data;
        }))

        .pipe(data(function(file) {
          var path = file.path.replace('.html', '.json');
          if (fs.existsSync(path)) {
            return require(path);  
          }
        }))

        .pipe(data(function(file) {
          var path = file.path.replace('.html', '.md.json');
          if (fs.existsSync(path)) {
            return require(path);  
          }
        }))

        .pipe(data(function(file) {
          return { 'foo': 'bar' }
        })) 

        .pipe(data(function(file) { 
            file.data.fakeName = faker.name.findName();
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
            lorem: faker.name.findName(), // Rowan Nikolaus
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
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./web/css'))
    .pipe(browserSync.stream());
});

// ----------------------------------------------------------------
gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './web',
      open: 'external'
    }
  });

  gulp.watch(['./gulpfile.js'], ['html'])
  gulp.watch(['./src/scss/**/*.scss'], ['sass'])
  gulp.watch(['./src/js/*.js'], ['js']);
  gulp.watch(['./src/**/*.hbs'], ['html']);
  gulp.watch(['./site/**/*.html'], ['html']).on('change', browserSync.reload);
  gulp.watch(['./site/**/*.json'], ['html']).on('change', browserSync.reload);
  gulp.watch(['./src/data/**/*.json'], ['html']);
  gulp.watch(['./web/{scss,css,js}/*.{scss,css,js}']).on('change', browserSync.reload);
  gulp.watch(['./web/*.html']).on('change', browserSync.reload);
});


// ----------------------------------------------------- Default
gulp.task( 'default', [ 'sass','scripts', 'browser-sync' ] );

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
