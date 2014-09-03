
/**
 * Module dependencies.
 */

var util = require('util'),
    Base = require('./base')
    , cursor = Base.cursor
    , color = Base.color;

/**
 * Expose `Spec`.
 */

exports = module.exports = Spec;

/**
 * Initialize a new `Spec` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function Spec(runner) {
  var buffer = "";

  Base.call(this, runner);

  var self = this
      , stats = this.stats
      , indents = 0
      , n = 0;

  function log(str) {
    buffer += formatArgs(arguments);
  }

  function formatArgs(args){
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
  }

  function indent() {
    return Array(indents).join('  ')
  }

  runner.on('start', function(){
    log();
  });

  runner.on('suite', function(suite){
    ++indents;
    log(color('suite', '%s%s'), indent(), suite.title);
  });

  runner.on('suite end', function(suite){
    --indents;
    if (1 == indents) log();

    console.log(buffer);
  });

  runner.on('pending', function(test){
    var fmt = indent() + color('pending', '  - %s');
    log(fmt, test.title);
  });

  runner.on('pass', function(test){
    if ('fast' == test.speed) {
      var fmt = indent()
          + color('checkmark', '  ' + Base.symbols.ok)
          + color('pass', ' %s ');
      cursor.CR();
      log(fmt, test.title);
    } else {
      var fmt = indent()
          + color('checkmark', '  ' + Base.symbols.ok)
          + color('pass', ' %s ')
          + color(test.speed, '(%dms)');
      cursor.CR();
      log(fmt, test.title, test.duration);
    }
  });

  runner.on('fail', function(test, err){
    cursor.CR();
    log(indent() + color('fail', '  %d) %s'), ++n, test.title);
  });

  runner.on('end', self.epilogue.bind(self));
}

/**
 * Inherit from `Base.prototype`.
 */

Spec.prototype.__proto__ = Base.prototype;