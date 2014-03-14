var fs   = require('fs')
   ,BlessYou = require('../server.js')
   ,assert = require('assert')
   ,post = require('./post.js')
   ,port = 38475

describe("Less global variable sessions", function() {
   var server = new BlessYou();
   before(function(done) {
      server.listen(port, null, done);
   });

   it("should allow global mixins to be used repeatedly", function(done) {
      var globals = ".b() { width:1; }";
      var less = "a { .b() }";
      var expectedCss = ["a {",
                        "  width: 1;",
                        "}\n"].join("\n");
      post(port, '/session', globals)
      .then(function(body) {
         var sessionid = body
         post(port, '/?session=' + sessionid , less)
         .then(function(body) {
            assert.equal(expectedCss, body);
            done();
         }).done();
      });
   });

   after(function() {
      server.close();
   });
});

