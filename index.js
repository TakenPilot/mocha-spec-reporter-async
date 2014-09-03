/**
 * Module dependencies.
 */

var Base = require('./base'),
    cursor = Base.cursor,
    color = Base.color;

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
  Base.call(this, runner);

  var self = this
      , stats = this.stats
      , indents = 0
      , n = 0;

  function indent() {
    return Array(indents).join('  ')
  }

  runner.on('start', function(){
    this.log();
  }.bind(this));

  runner.on('suite', function(suite){
    ++indents;
    this.log(color('suite', '%s%s'), indent(), suite.title);
  }.bind(this));

  runner.on('suite end', function(suite){
    --indents;
    if (1 == indents) this.log();
  }.bind(this));

  runner.on('pending', function(test){
    var fmt = indent() + color('pending', '  - %s');
    this.log(fmt, test.title);
  }.bind(this));

  runner.on('pass', function(test){
    if ('fast' == test.speed) {
      var fmt = indent() + color('checkmark', '  ' + Base.symbols.ok)
          + color('pass', ' %s ');
      cursor.CR();
      this.log(fmt, test.title);
    } else {
      var fmt = indent()
          + color('checkmark', '  ' + Base.symbols.ok)
          + color('pass', ' %s ')
          + color(test.speed, '(%dms)');
      cursor.CR();
      this.log(fmt, test.title, test.duration);
    }
  }.bind(this));

  runner.on('fail', function(test, err){
    cursor.CR();
    this.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
  }.bind(this));

  runner.on('end', self.epilogue.bind(self));
}

/**
 * Inherit from `Base.prototype`.
 */

Spec.prototype.__proto__ = Base.prototype;