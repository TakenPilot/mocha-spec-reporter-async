mocha-spec-reporter-async
--------------------------

Used when reporting from Gulp. Outputs all test results at once to avoid an async console.log mess.

> **⚠ Warning**
> This library is deprecated. The underlying libraries that this package relies on are either unmaintained or have security warnings. I'm deprecating this project until someone rewrites it with modern tooling.

##Example
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

##To DO
* Lower code complexity
* Find better way to convert checkmarks and ecks between windows and linux/mac.
