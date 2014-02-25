var fs   = require('fs')
   ,Q    = require('q')
   ,http = require('http')
   ,less = require('less')
   ,port = 8000

l = console.log;

var parser = new less.Parser();

http.createServer(function (req, res) {
   var time = Date.now();
   l("Start request");
   readEntireBody(req)
   .then(parseLess)
   .then(outputCss(res))
   .then(function() {
      time = Date.now() - time;
      l("Finished request: " + Math.round(time,3));
   })
   .fail(function(err) {
      l("Got Error: " + err);
      res.statusCode=500;
      res.end(err)
   });
}).listen(8000);

function readEntireBody(stream) {
   var deferred = Q.defer()
   var body = ''
   stream.setEncoding('utf8')
   stream.on('data', function (chunk) {
      body += chunk
   });
   stream.on('end', function () {
      deferred.resolve(body);
   });
   stream.on('close', function (err) {
      deferred.reject(err);
   });
   return deferred.promise;
}

function parseLess(body) {
   var deferred = Q.defer()
   var parser = new less.Parser();
   parser.parse(body, deferred.makeNodeResolver());
   return deferred.promise;
}

function outputCss(res) {
   return function (parseTree) {
      var css = parseTree.toCSS();
      res.statusCode = 200;
      res.end(css);
      return Q.fcall(function(){});
   }
}

