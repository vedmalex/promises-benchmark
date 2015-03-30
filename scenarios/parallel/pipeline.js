var utils = require('./utils');
var pb = require('pipeline.js-builder');

var parallelRunner = pb.Parallel()
  .split(function(ctx) {
    return ctx.xs.map(function(item) {
      return {
        x: item,
        f: ctx.f
      };
    });
  })
  .stage(function(ctx, done) {
    ctx.f(ctx.x, function(err, v) {
      ctx.v = v;
      done();
    });
  })
  .combine(function(ctx, children) {
    ctx.result = children.map(function(item) {
      return item.v;
    });

  })
  .build().toCallback();

function parallel(xs, f, done) {
  parallelRunner({
    xs: xs,
    f: f
  }, function(err, ctx) {
    if (!err) done(null, ctx.result);
    else done(err);
  });
}


module.exports = {
  cached: function(list, done) {
    return function(deferred) {
      utils.cache = {};
      parallel(list, utils.read, function(err, r) {
        if (err) throw err;
        else done(deferred);
      });
    };
  },

  naive: function(list, done) {
    return function(deferred) {
      parallel(list, utils.readFile, function(err, r) {

        if (err) {
          debugger;
          err.stack;
          throw err;
        }
        done(deferred);
      });
    };
  }
};