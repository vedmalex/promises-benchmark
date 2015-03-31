var utils = require('./utils');
var pb = require('pipeline.js-builder');

var parallelRunner = pb.Parallel()
  .split(function(ctx) {
    var res = [];
    for (var i = 0, len = ctx.xs.length; i < len; i++) {
      res.push({
        x: ctx.xs[i],
        f: ctx.f
      });
    }
    return res;
  })
  .stage(function(ctx, done) {
    ctx.f(ctx.x, function(err, v) {
      ctx.v = v;
      done();
    });
  })
  .combine(function(ctx, children) {
    var res = [];
    for (var i = 0, len = children.length; i < len; i++) {
      res.push(children[i].v);
    }
    ctx.result = res;
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
          throw err;
        }
        done(deferred);
      });
    };
  }
};