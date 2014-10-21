// disable logging during tests
require('../log.js').log = function(){};

var fs   = require('fs')
   ,BlessYou = require('../server.js')
   ,assert = require('assert')
   ,post = require('./post.js')
   ,port = 38475

describe("Less compile via http", function() {
   var server = new BlessYou();
   before(function(done) {
      server.listen(port, null, done);
   });

   it("should respond with css to a POST of less", function(done) {
      var less = "a { b { width:1; }}";
      var expectedCss = ["a b {",
                        "  width: 1;",
                        "}\n"].join("\n");
      post(port, '/', less)
      .then(function(body) {
         assert.equal(body, expectedCss);
         done();
      }).done();
   });

   it("should translate query params to parser options", function(done) {
      var less = "a { x: url(http://thing) }";
      var expectedCss = ["a {",
                        "  x: url(http://thing?extra);",
                        "}\n"].join("\n");
      post(port, '/?options={"urlArgs":"extra"}', less)
      .then(function(body) {
         assert.equal(body, expectedCss);
         done();
      }).done();
   });

   after(function() {
      server.close();
   });
});

