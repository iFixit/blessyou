// disable logging during tests
require('../log.js').log = function(){};

var fs   = require('fs')
   ,BlessYou = require('../server.js')
   ,MemoryCache = require('./memory-cache.js')
   ,Cache = require('../cache.js')
   ,assert = require('assert')
   ,post = require('./post.js')
   ,port = 38476

describe("Caching", function() {
   var memoryCache = MemoryCache();
   var server = new BlessYou({
      cache: Cache({memcache: memoryCache})
   });

   before(function(done) {
      server.listen(port, null, done);
   });

   var css = "a .b {\n  width: 1;\n}\n";
   var less = "a{.b{width:1}}";

   it("should return a miss, then a hit", function() {
      return assertCacheMiss(css, less)
      .then(function() {
         return assertCacheHit(css, less)
      });
   });

   it("should return a miss if less changes", function() {
      const myLess = less + " ";
      return assertCacheMiss(css, myLess)
      .then(function() {
         return assertCacheMiss(css, myLess + " ")
      })
   });

   it("should return a miss if less options change", function() {
      var myLess = less + "a{}";
      return assertCacheMiss(css, myLess)
      .then(function() {
         return assertCacheMiss(css, myLess, '?options={"a":2}')
      })
   });

   describe("with a session", function() {
      it("should return a miss if less options change", function() {
         return withSession(".b() { width:1; }").then(sessionid => {
            const myLess = "a{.b()}";
            const myCss = "a {\n  width: 1;\n}\n";
            const url = '?session=' + sessionid;
            return assertCacheMiss(myCss, myLess, url)
            .then(function() {
               return assertCacheMiss(myCss, myLess, url + '&options={"a":2}')
            })
         })
      });

      it("should return a miss if the same less is compiled in a session", function() {
         const myLess = less + "b{}";
         return assertCacheMiss(css, myLess)
         .then(function() {
            return assertCacheHit(css, myLess)
         }).then(() => {
            return withSession(".b() { width:1; }")
         }).then(sessionid => {
            const url = '?session=' + sessionid;
            return assertCacheMiss(css, myLess, url)
            .then(function() {
               return assertCacheHit(css, myLess, url)
            })
         })
      });
   });

   after(function() {
      server.close();
   });

   function assertCacheMiss(expectedCss, less, url) {
      const count = keyCount();
      return assertCompiles(expectedCss, less, url).then(() =>
         assert.equal(count + 1, keyCount(), "wasn't a cache miss less:" + less + "url: " + url)
      );
   }

   function assertCacheHit(expectedCss, less, url) {
      const count = keyCount();
      return assertCompiles(expectedCss, less, url).then(() =>
         assert.equal(count, keyCount(), "wasn't a cache hit less:" + less + "url: " + url)
      );
   }

   function assertCompiles(expectedCss, less, url) {
      return post(port, '/' + url, less)
      .then(function(body) {
         assert.equal(expectedCss, body);
      });
   }

   function withSession(globalLess) {
      return post(port, '/session', globalLess)
   }

   function keyCount() {
      return Object.keys(memoryCache.getCache()).length;
   }
});

