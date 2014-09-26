mocha-spec-reporter-async
--------------------------

Used when reporting from Gulp. Outputs all test results at once to avoid an async console.log mess.

[![Build Status](https://travis-ci.org/TakenPilot/mocha-spec-reporter-async.svg?branch=master)](https://travis-ci.org/TakenPilot/mocha-spec-reporter-async)

[![Code Climate](https://codeclimate.com/github/TakenPilot/mocha-spec-reporter-async/badges/gpa.svg)](https://codeclimate.com/github/TakenPilot/mocha-spec-reporter-async)

[![Coverage Status](https://coveralls.io/repos/TakenPilot/mocha-spec-reporter-async/badge.png?branch=master)](https://coveralls.io/r/TakenPilot/mocha-spec-reporter-async?branch=master)

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
* Add tests for color