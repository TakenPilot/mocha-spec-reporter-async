var tty = require('tty'),
  util = require('util'),
  diff = require('diff'),
  ms = require('mocha/lib/ms'),
  _ = require('lodash'),
  utils = require('mocha/lib/utils');

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
/*ignore jslint start*/
var Date = global.Date,
  setTimeout = global.setTimeout,
  setInterval = global.setInterval,
  clearTimeout = global.clearTimeout,
  clearInterval = global.clearInterval;
/*ignore jslint end*/

/**
 * Check if both stdio streams are associated with a tty.
 */
var isatty = tty.isatty(1) && tty.isatty(2);

/**
 * Expose `Base`.
 */
exports = module.exports = Base;

/**
 * Enable coloring by default.
 */
exports.useColors = isatty || (process.env.MOCHA_COLORS !== undefined);

/**
 * Inline diffs instead of +/-
 */
exports.inlineDiffs = false;

/**
 * Default color map.
 */
exports.colors = {
  'pass': 90,
  'fail': 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  'pending': 36,
  'suite': 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  'checkmark': 32,
  'fast': 90,
  'medium': 33,
  'slow': 31,
  'green': 32,
  'light': 90,
  'diff gutter': 90,
  'diff added': 42,
  'diff removed': 41
};

/**
 * Default symbol map.
 */

exports.symbols = {
  ok: '✓',
  err: '✖',
  dot: '․'
};

// With node.js on Windows: use symbols available in terminal default fonts
if ('win32' === process.platform) {
  exports.symbols.ok = '\u221A';
  exports.symbols.err = '\u00D7';
  exports.symbols.dot = '.';
}

/**
 * Color `str` with the given `type`,
 * allowing colors to be disabled,
 * as well as user-defined color
 * schemes.
 *
 * @param {String} type
 * @param {String} str
 * @return {String}
 * @api private
 */

var color = exports.color = function (type, str) {
  if (!exports.useColors) {
    return str;
  }
  return '\u001b[' + exports.colors[type] + 'm' + str + '\u001b[0m';
};

/**
 * Expose term window size, with some
 * defaults for when stderr is not a tty.
 */

exports.window = {
  width: isatty ?
    process.stdout.getWindowSize ?
      process.stdout.getWindowSize(1)[0] : tty.getWindowSize()[1] : 75
};

/**
 * Expose some basic cursor interactions
 * that are common among reporters.
 */

exports.cursor = {
  hide: function () {
    if (isatty) {
      process.stdout.write('\u001b[?25l');
    }
  },

  show: function () {
    if (isatty) {
      process.stdout.write('\u001b[?25h');
    }
  },

  deleteLine: function () {
    if (isatty) {
      process.stdout.write('\u001b[2K');
    }
  },

  beginningOfLine: function () {
    if (isatty) {
      process.stdout.write('\u001b[0G');
    }
  },

  CR: function () {
    if (isatty) {
      exports.cursor.deleteLine();
      exports.cursor.beginningOfLine();
    } else {
      process.stdout.write('\r');
    }
  }
};

/**
 * Initialize a new `Base` reporter.
 *
 * All other reporters generally
 * inherit from this reporter, providing
 * stats such as test duration, number
 * of tests passed / failed etc.
 *
 * @param {Runner} runner
 * @api public
 */

function Base(runner) {
  var self = this,
    n = 0,
    indents = 0,
    stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 },
    failures = this.failures = [];

  function indent() {
    var str = "";
    for (var i = 1; i < indents; i++) {
      str += '  ';
    }
    return str;
  }

  if (!runner) {
    return;
  }
  this.runner = runner;

  runner.stats = stats;

  runner.on('start', function () {
    stats.start = new Date;
    self.log();
  });

  runner.on('suite', function (suite) {
    if (!suite) {
      throw new Error('Missing first parameter');
    }

    var title = suite.title || "";
    stats.suites = stats.suites || 0;
    if (!suite.root) {
      stats.suites++;
    }
    indents++;
    self.log(color('suite', '%s%s'), indent(), title);
  });

  runner.on('suite end', function (suite) {
    --indents;
    if (1 === indents) {
      self.log();
    }
  });

  runner.on('test end', function (test) {
    stats.tests = stats.tests || 0;
    stats.tests++;
  });

  runner.on('pass', function (test) {
    if (!test) {
      throw new Error('Missing first parameter');
    }

    stats.passes = stats.passes || 0;

    var slow, medium, duration = test.duration;
    if (test && _.isFunction(test.slow)) {
      slow = test.slow();
      medium = slow / 2;
      if (duration > slow) {
        test.speed = 'slow';
      } else if (test.duration > medium) {
        test.speed = 'medium';
      } else {
        test.speed = 'fast';
      }
    } else {
      test.speed = 'fast';
    }

    stats.passes++;

    var fmt, title = test.title || "";
    if ('fast' === test.speed) {
      fmt = indent() + color('checkmark', '  ' + Base.symbols.ok) + color('pass', ' %s ');
      Base.cursor.CR();
      self.log(fmt, title);
    } else {
      fmt = indent() + color('checkmark', '  ' + Base.symbols.ok) + color('pass', ' %s ') + color(test.speed, '(%dms)');
      Base.cursor.CR();
      self.log(fmt, title, duration);
    }
  });

  runner.on('fail', function (test, err) {
    stats.failures = stats.failures || 0;
    stats.failures++;
    test.err = err;
    failures.push(test);

    Base.cursor.CR();
    self.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
  });

  runner.on('end', function () {
    stats.end = new Date();
    stats.duration = new Date() - stats.start;

    self.epilogue();
  });

  runner.on('pending', function (test) {
    stats.pending++;
    var fmt = indent() + color('pending', '  - %s');
    self.log(fmt, test.title);
  });
}

Base.prototype.getBuffer = function () {
  return this._buffer;
};

Base.prototype.print = function () {
  var buffer = this._buffer;
  console.log(buffer);
  this._buffer = "";
};

Base.prototype.error = Base.prototype.log = function () {
  var buffer = this._buffer || "";
  buffer += util.format.apply(util, Array.prototype.slice.call(arguments)) + '\n';
  this._buffer = buffer;
};

/**
 * Outut the given `failures` as a list.
 *
 * @param {Array} failures
 * @api public
 */

Base.prototype.list = function (failures) {

  var self = this;
  self.error();
  failures.forEach(function (test, i) {
    // format
    var fmt = color('error title', '  %s) %s:\n') +
      color('error message', '     %s') +
      color('error stack', '\n%s\n');

    // msg
    var err = test.err,
      message = err.message || '',
      stack = err.stack || message,
      index = stack.indexOf(message) + message.length,
      msg = stack.slice(0, index),
      actual = err.actual,
      expected = err.expected,
      escape = true;

    // uncaught
    if (err.uncaught) {
      msg = 'Uncaught ' + msg;
    }

    // explicitly show diff
    if (err.showDiff && sameType(actual, expected)) {
      escape = false;
      err.actual = actual = utils.stringify(actual);
      err.expected = expected = utils.stringify(expected);
    }

    // actual / expected diff
    if ('string' === typeof actual && 'string' === typeof expected) {
      fmt = color('error title', '  %s) %s:\n%s') + color('error stack', '\n%s\n');
      var match = message.match(/^([^:]+): expected/);
      msg = '\n      ' + color('error message', match ? match[1] : msg);

      if (exports.inlineDiffs) {
        msg += inlineDiff(err, escape);
      } else {
        msg += unifiedDiff(err, escape);
      }
    }

    // indent stack trace without msg
    stack = stack.slice(index ? index + 1 : index)
      .replace(/^/gm, '  ');

    self.error(fmt, (i + 1), test.fullTitle(), msg, stack);
  });
};

/**
 * Output common epilogue used by many of
 * the bundled reporters.
 *
 * @api public
 */
Base.prototype.epilogue = function () {
  var stats = this.stats;
  var fmt;
  var self = this;

  self.log();

  // passes
  fmt = color('bright pass', ' ') + color('green', ' %d passing') + color('light', ' (%s)');

  self.log(fmt, stats.passes || 0, ms(stats.duration));

  // pending
  if (stats.pending) {
    fmt = color('pending', ' ') + color('pending', ' %d pending');

    self.log(fmt, stats.pending);
  }

  // failures
  if (stats.failures) {
    fmt = color('fail', '  %d failing');

    self.error(fmt, stats.failures);

    self.list(this.failures);
    self.error();
  }

  self.log();

  self.print();
};

/**
 * Pad the given `str` to `len`.
 *
 * @param {String} str
 * @param {String} len
 * @return {String}
 * @api private
 */
function pad(str, len) {
  str = String(str);
  return Array(len - str.length + 1).join(' ') + str;
}


/**
 * Returns an inline diff between 2 strings with coloured ANSI output
 *
 * @param {Error} Error with actual/expected
 * @return {String} Diff
 * @api private
 */
function inlineDiff(err, escape) {
  var msg = errorDiff(err, 'WordsWithSpace', escape);

  // linenos
  var lines = msg.split('\n');
  if (lines.length > 4) {
    var width = String(lines.length).length;
    msg = lines.map(function (str, i) {
      i++;
      return pad(i, width) + ' |' + ' ' + str;
    }).join('\n');
  }

  // legend
  msg = '\n' + color('diff removed', 'actual') + ' ' + color('diff added', 'expected') +
    '\n\n' + msg + '\n';

  // indent
  msg = msg.replace(/^/gm, '      ');
  return msg;
}

/**
 * Returns a unified diff between 2 strings
 *
 * @param {Error} Error with actual/expected
 * @return {String} Diff
 * @api private
 */
function unifiedDiff(err, escape) {
  var indent = '      ';

  function cleanUp(line) {
    if (escape) {
      line = escapeInvisibles(line);
    }
    if (line[0] === '+') {
      return indent + colorLines('diff added', line);
    }
    if (line[0] === '-') {
      return indent + colorLines('diff removed', line);
    }
    if (line.match(/\@\@/)) {
      return null;
    }
    if (line.match(/\\ No newline/)) {
      return null;
    }
    else {
      return indent + line;
    }
  }

  function notBlank(line) {
    return line != null;
  }

  var msg = diff.createPatch('string', err.actual, err.expected);
  var lines = msg.split('\n').splice(4);
  return '\n      ' + colorLines('diff added', '+ expected') + ' ' +
    colorLines('diff removed', '- actual') + '\n\n' +
    lines.map(cleanUp).filter(notBlank).join('\n');
}

/**
 * Return a character diff for `err`.
 *
 * @param {Error} err
 * @return {String}
 * @api private
 */
function errorDiff(err, type, escape) {
  var actual = escape ? escapeInvisibles(err.actual) : err.actual;
  var expected = escape ? escapeInvisibles(err.expected) : err.expected;
  return diff['diff' + type](actual, expected).map(function (str) {
    if (str.added) {
      return colorLines('diff added', str.value);
    }
    if (str.removed) {
      return colorLines('diff removed', str.value);
    }
    return str.value;
  }).join('');
}

/**
 * Returns a string with all invisible characters in plain text
 *
 * @param {String} line
 * @return {String}
 * @api private
 */
function escapeInvisibles(line) {
  return line.replace(/\t/g, '<tab>')
    .replace(/\r/g, '<CR>')
    .replace(/\n/g, '<LF>\n');
}

/**
 * Color lines for `str`, using the color `name`.
 *
 * @param {String} name
 * @param {String} str
 * @return {String}
 * @api private
 */
function colorLines(name, str) {
  return str.split('\n').map(function (str) {
    return color(name, str);
  }).join('\n');
}

/**
 * Check that a / b have the same type.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 * @api private
 */
function sameType(a, b) {
  a = Object.prototype.toString.call(a);
  b = Object.prototype.toString.call(b);
  return a == b;
}
