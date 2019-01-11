// disable logging during tests
require('../log.js').log = function(){};

var fs   = require('fs')
   ,BlessYou = require('../server.js')
   ,memoryCache = require('./memory-cache.js')()
   ,Cache = require('../cache.js')
   ,assert = require('assert')
   ,post = require('./post.js')
   ,port = 38476
   ,l    = require('../log.js').log;

describe("Caching", function() {
   var server = new BlessYou({
      cache: Cache({memcache: memoryCache})
   });
   before(function(done) {
      server.listen(port, null, done);
   });

   it("should return a miss, then a hit", function(done) {
      assertCacheMiss("a .b {\n  width: 1;\n}\n",  "a{.b{width:1}}")
      .then(function() {
         return assertCacheHit("a .b {\n  width: 1;\n}\n",  "a{.b{width:1}}")
      })
      .then(done).done();
   });

   after(function() {
      server.close();
   });

   function assertCacheMiss(expectedCss, less) {
      const count = keyCount();
      return assertCompiles(expectedCss, less).then(() =>
         assert.equal(count + 1, keyCount())
      );
   }

   function assertCacheHit(expectedCss, less) {
      const count = keyCount();
      return assertCompiles(expectedCss, less).then(() =>
         assert.equal(count, keyCount())
      );
   }

   function assertCompiles(expectedCss, less) {
      return post(port, '/', less)
      .then(function(body) {
         assert.equal(expectedCss, body);
      });
   }


   function keyCount() {
      return Object.keys(memoryCache.getCache()).length;
   }
});

