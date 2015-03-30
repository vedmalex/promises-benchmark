var mpromise       = require('mpromise')
var listTest = require('./promises')(function(f) {
                                       var p = mpromise.deferred()
                                       f(p.resolve, p.reject)
                                       return p.promise })

module.exports = function(path, noiseFactor) { return function(deferred) {
  return listTest(path, noiseFactor)
           .then(function(v){
                   deferred.resolve() })
           .end()
}}