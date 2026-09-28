// disable logging during tests
var log = require('../log.js');
log.log = function(){};

var http = require('http')
   ,BlessYou = require('../server.js')
   ,MemoryCache = require('./memory-cache.js')
   ,Cache = require('../cache.js')
   ,assert = require('assert')
   ,post = require('./post.js')
   ,port = 38477

describe("Access log", function() {
   var server = new BlessYou({
      cache: Cache({memcache: MemoryCache()})
   });

   before(function(done) {
      server.listen(port, null, done);
   });

   afterEach(function() {
      log.log = function(){};
   });

   it("should log a successful compile", function() {
      var line = nextLogLine();
      return post(port, '/', "a{b{width:1}}")
      .then(function() { return line; })
      .then(function(line) {
         assertMatches(line, /^\S+ - - \[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000\] /);
         assertMatches(line, / "POST \/ HTTP\/1\.1" 200 20 "-" "-" [\d.]+ms in:13 cache:miss$/);
      });
   });

   it("should log cache hits", function() {
      return post(port, '/', "a{c{width:1}}")
      .then(function() {
         var line = nextLogLine();
         return post(port, '/', "a{c{width:1}}")
         .then(function() { return line; });
      }).then(function(line) {
         assertMatches(line, / 200 20 .* cache:hit$/);
      });
   });

   it("should log session creation", function() {
      var line = nextLogLine();
      return post(port, '/session', ".b() { width:1; }")
      .then(function() { return line; })
      .then(function(line) {
         assertMatches(line, / "POST \/session HTTP\/1\.1" 200 32 .* in:17 cache:-$/);
      });
   });

   it("should log failures", function() {
      var line = nextLogLine();
      return post(port, '/?session=doesntexist', "a{}")
      .then(function() {
         throw new Error("Missing session should produce an error");
      }, function() {
         return line;
      }).then(function(line) {
         assertMatches(line, / "POST \/\?session=doesntexist HTTP\/1\.1" 500 /);
      });
   });

   it("should log rejected non-POST requests", function() {
      var line = nextLogLine();
      http.get({host: 'localhost', port: port, path: '/'}, function(res) {
         res.resume();
      });
      return line.then(function(line) {
         assertMatches(line, / "GET \/ HTTP\/1\.1" 404 - "-" "-" [\d.]+ms in:- cache:-$/);
      });
   });

   it("should escape quotes and control characters", function() {
      var line = nextLogLine();
      http.get({
         host: 'localhost',
         port: port,
         path: '/?options={"a":1}',
         headers: {'User-Agent': 'agent "007"\t\\'}
      }, function(res) {
         res.resume();
      });
      return line.then(function(line) {
         assert.ok(line.indexOf(
            '"GET /?options={\\x22a\\x22:1} HTTP/1.1" 404 - "-" ' +
            '"agent \\x22007\\x22\\x09\\x5c"') !== -1, line);
      });
   });

   after(function() {
      server.close();
   });

   function assertMatches(line, regex) {
      assert.ok(regex.test(line), line + " doesn't match " + regex);
   }

   // Resolves with the next line the server logs.
   function nextLogLine() {
      return new Promise(function(resolve) {
         log.log = function(line) {
            log.log = function(){};
            resolve(line);
         };
      });
   }
});
