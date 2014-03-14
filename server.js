var Q    = require('q')
   ,connect = require('connect')
   ,http = require('http')
   ,less = require('less')
   ,getBody = require('./get-body.js')
   ,parserOptions = require('./parser-options.js')
   ,sessions = require('./sessions.js')()
   ,l    = console.log;

module.exports = function() {
   var app = connect()
   .use(denyNonPosts)
   .use(receiveBody)
   .use(connect.query())
   .use('/session', createSession)
   .use(convertLess)

   return http.createServer(app)
}

function denyNonPosts(req, res, next) {
   if (req.method !== 'POST') {
      res.statusCode = 404;
      return res.end();
   }
   next();
}

function receiveBody(req, res, next) {
   req.time = process.hrtime();
   getBody(req).then(function(body) {
      req.body = body;
      next();
   })
}

function createSession(req, res, next) {
   sessions.create(req.body)
   .then(function(session) {
      res.end(session.token)
   }).fail(handleFailure(res, req));
}

function convertLess(req, res, next) {
   var time;
   var inLength = req.body.length;

   parseLess(req.body)
   .then(function(ast) {
      if (req.query.session) {
         var session = sessions.get(req.query.session);
         ast.rules = session.ast.rules.concat(ast.rules);
      }
      return ast;
   })
   .then(outputCss(res))
   .then(function(css) {
      time = process.hrtime(req.time);
      var ms = time[0]*1000 + time[1] / 1e6
      var outLength = Buffer.byteLength(css)
      var sizeMsg = round(inLength/1000) + "k -> " + round(outLength/1000) + "k"
      l("("+round(ms)+"ms - "+sizeMsg+"):" + req.url)
   })
   .fail(handleFailure(req, res));
}

function handleFailure(req, res) {
   return function (err) {
      var message = less.formatError(err, {color:false})
      l("Got Error: " + req.url + "\n" +  message)
      res.statusCode = 500;
      res.end("" + message)
   }
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

