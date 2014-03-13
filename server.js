var Q    = require('q')
   ,http = require('http')
   ,less = require('less')
   ,parserOptions = require('./parser-options.js')
   ,l    = console.log;

module.exports = function() {
   return http.createServer(function (req, res) {
      var time = process.hrtime();
      var inLength;

      if (req.method !== 'POST') {
         res.statusCode = 404;
         return res.end();
      }

      var body = readEntireBody(req);
      body.then(function(body) {
         // Capture the byte length for logging at the end
         inLength = Buffer.byteLength(body)
      })

      body.then(parseLess)
      .then(outputCss(res))
      .then(function(css) {
         time = process.hrtime(time);
         var ms = time[0]*1000 + time[1] / 1e6
         var outLength = Buffer.byteLength(css)
         var sizeMsg = round(inLength/1000) + "k -> " + round(outLength/1000) + "k"
         l("("+round(ms)+"ms - "+sizeMsg+"):" + req.url)
      })
      .fail(function(err) {
         var message = less.formatError(err, {color:false})
         l("Got Error: " + req.url + "\n" +  message)
         res.statusCode = 500;
         res.end("" + message)
      });
   })
}

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
   var parser = new less.Parser(parserOptions);
   parser.parse(body, deferred.makeNodeResolver());
   return deferred.promise;
}

function outputCss(res) {
   return function (parseTree) {
      var css = parseTree.toCSS(parserOptions);
      res.writeHead(200, "Content-Type: text/css");
      res.end(css);
      return Q.fcall(function(){
         return css;
      });
   }
}

function round(num, places) {
   var scale = Math.pow(10, places === undefined ? 1: places)
   return Math.round(num*scale)/scale
}

