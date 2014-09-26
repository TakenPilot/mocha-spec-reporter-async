var sinon = require('sinon'),
  expect = require('chai').expect,
  Reporter = require('../.');

describe('Reporter', function () {
  var mockRunner = {
    on: function() {}
  };
  var sandbox, reporter;

  beforeEach(function () {
    Reporter.useColors = false;
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('able to load', function () {
    reporter = new Reporter(mockRunner);
  });

  it('should handle start', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });

    //act
    fn['start']();

    //assert
    spy.calledWith('')
  });

  it('should handle end', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });

    //act
    fn['end']();

    //assert
    spy.calledWith('')
  });

  it('should handle end with stats', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });
    reporter.stats = {pending: 7};

    //act
    fn['end']();

    //assert
    spy.calledWith('')
  });

  it('should handle end with failure', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });
    reporter.stats = {failures: 1};
    reporter.failures = [{err: {}}];

    //act
    fn['end']();

    //assert
    spy.calledWith('')
  });

  it('should handle end with uncaught failure', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });
    reporter.stats = {failures: 1};
    reporter.failures = [{
      err: {
        uncaught: true,
        showDiff: true,
        actual: "AAaab",
        expected: "ABbbb"
      }
    }];

    //act
    fn['end']();

    //assert
    spy.calledWith('')
  });

  it('should handle end with uncaught failure with inline diffs', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);
    var spy = sandbox.stub(reporter, 'print', function (eventName, eventFn) { fn = eventFn; });
    reporter.stats = {failures: 1};
    Reporter.inlineDiffs = true;
    reporter.failures = [{
      err: {
        uncaught: true,
        showDiff: true,
        actual: "Aaa",
        expected: "Bbb"
      }
    }];

    //act
    fn['end']();

    //assert
    spy.calledWith('')
  });

  it('should handle test end', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fn['test end']();
  });

  it('should handle pending', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fn['pending']({});
  });

  it('should handle suite end', function () {
    var fn = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fn[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fn['suite end']();
  });

  it('should handle unnamed suite', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['suite']({});

    //assert
    expect(reporter.getBuffer()).to.equal('\n');
  });

  it('should handle named suite', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['suite']({title: "someName"});

    //assert
    expect(reporter.getBuffer()).to.equal('someName\n');
  });

  it('should handle unnamed pass', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['pass']({});

    //assert
    expect(reporter.getBuffer()).to.equal('  ✓  \n');
  });

  it('should handle pass', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['pass']({title: 'someTestName'});

    //assert
    expect(reporter.getBuffer()).to.equal('  ✓ someTestName \n');
  });

  it('should handle fail', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['fail']({title: 'someTestName'});

    //assert
    expect(reporter.getBuffer()).to.equal("  1) someTestName\n");
  });

  it('should count failures', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['fail']({title: 'someTestName'});
    fns['fail']({title: 'someTestName'});

    //assert
    expect(reporter.getBuffer()).to.equal("  1) someTestName\n  2) someTestName\n");
  });

  it('should count failures', function () {
    var fns = {};
    sandbox.stub(mockRunner, 'on', function (eventName, eventFn) { fns[eventName] = eventFn; });
    reporter = new Reporter(mockRunner);

    //act
    fns['fail']({title: 'someTestName'});
    fns['fail']({title: 'someTestName'});

    //assert
    expect(reporter.getBuffer()).to.equal("  1) someTestName\n  2) someTestName\n");
  });
});