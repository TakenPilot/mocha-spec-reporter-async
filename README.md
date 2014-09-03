mocha-spec-reporter-async
--------------------------

Used when reporting from Gulp. Outputs all test results at once to avoid an async console.log mess.

```JavaScript
gulp.task('unit tests', function (done) {
  var mocha = require('gulp-mocha');

  return gulp.src('./test/unit/**/*.js', {read: false})
      .pipe(mocha({
        reporter: 'mocha-spec-reporter-async',
        growl: true,
        ui: 'bdd'
      }));
});
```