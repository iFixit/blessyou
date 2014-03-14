var Q    = require('q')
   ,http = require('http')
   ,less = require('less')
   ,getBody = require('./get-body.js')
   ,parserOptions = require('./parser-options.js')
   ,sessions = require('./sessions.js')()
   ,l    = console.log;

module.exports = function() {
   return http.createServer(function (req, res) {
      var time = process.hrtime();
      var inLength;

      if (req.method !== 'POST') {
         res.statusCode = 404;
         return res.end();
      }

      var body = getBody(req);
      body.then(function(body) {
         // Capture the byte length for logging at the end
         inLength = Buffer.byteLength(body)
      }).done()

      if (req.url.indexOf("/session") == 0) {
         body.then(function(less) {
            return sessions.create(less);
         }).then(function(session) {
            res.end(session.token)
         }).fail(handleFailure);
         return;
      }

      body.then(parseLess)
      .then(function(ast) {
         req.params = require('url').parse(req.url, true).query;
         if (req.params.session) {
            var session = sessions.get(req.params.session);
            ast.rules = session.ast.rules.concat(ast.rules);
         }
         return ast;
      })
      .then(outputCss(res))
      .then(function(css) {
         time = process.hrtime(time);
         var ms = time[0]*1000 + time[1] / 1e6
         var outLength = Buffer.byteLength(css)
         var sizeMsg = round(inLength/1000) + "k -> " + round(outLength/1000) + "k"
         l("("+round(ms)+"ms - "+sizeMsg+"):" + req.url)
      })
      .fail(handleFailure);

      function handleFailure(err) {
         var message = less.formatError(err, {color:false})
         l("Got Error: " + req.url + "\n" +  message)
         res.statusCode = 500;
         res.end("" + message)
      }
   })
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

