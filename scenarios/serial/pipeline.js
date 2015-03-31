// -- Dependencies -----------------------------------------------------
var fs = require('fs');
var path = require('path');
var pb = require('pipeline.js-builder');

// -- Helpers ----------------------------------------------------------

function concatenate(xs, done) {
  done(null, xs.reduce(function(as, bs) {
    return as.concat(bs);
  }, []));
}


function join(xs, separator, done) {
  done(null, xs.join(separator));
}


function withParent(dir) {
  return function(file) {
    return path.join(dir, file);
  };
}


function isString(a) {
  return typeof a === 'string';
}


// -- Generators -------------------------------------------------------
var makeListRunner = pb.MWS()
  .case(function(ctx, done) {
    var n = ctx.noiseFactor;
    ctx.result[0] = n <= 0 ? [] : /* _ */ Array(n + 1).join(0)
      .split(0)
      .map(function(_, i) {
        return i;
      });
    done();
  })
  .case(function(ctx, done) {
    var dir = ctx.dir;
    fs.readdir(dir, function(err, files) {
      if (err) done(err);
      else {
        ctx.result[1] = files.map(withParent(dir));
        done();
      }
    });
  }).build().toCallback();

function makeLists(dir, noiseFactor, done) {
  makeListRunner({
    dir: dir,
    noiseFactor: noiseFactor,
    result: []
  }, function(err, ctx) {
    done(err, ctx.result);
  });

}

var readAllRunner = pb.Sequential()
  .split(function(ctx) {
    var res = [];
    for (var i = 0, len = ctx.files.length; i < len; i++) {
      res.push({filename:ctx.files[i]});
    }
    return res;
  })
  .stage(function(ctx, done) {
    if (isString(ctx.filename))
      fs.readFile(ctx.filename, {
        encoding: 'utf-8'
      }, function(err, content) {
        if (!err)
          ctx.content = content;
        done(err);
      });
    else {
      ctx.content = String(ctx.filename);
      done();
    }
  })
  .combine(function(ctx, children) {
    var res=[];
    for (var i = 0, len = children.length; i < len; i++) {
      res.push(children[i].content);
    }
    ctx.texts = res;
  }).build().toCallback();

function readAll(xs, done) {
  readAllRunner({
    files: xs
  }, function(err, ctx) {
    done(err, ctx.texts);
  });
}


// -- Core -------------------------------------------------------------
module.exports = function(dir, noiseFactor, done) {
  return function(deferred) {

    makeLists(dir, noiseFactor, function(err, items) {
      concatenate(items, function(err, files) {

        readAll(files, function(err, texts) {
          join(texts, '\n', function(err, result) {
            done(deferred, err, result);
          });
        });
      });
    });
  };
};