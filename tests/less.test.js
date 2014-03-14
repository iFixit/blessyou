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
         assert.equal(expectedCss, body);
         done();
      }).done();
   });

   after(function() {
      server.close();
   });
});

