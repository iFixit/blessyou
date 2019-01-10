var Q    = require('q')
   ,connect = require('connect')
   ,http = require('http')
   ,less = require('less')
   ,getBody = require('./get-body.js')
   ,parserOptions = require('./parser-options.js')
   ,sessions = require('./sessions.js')()
   ,l    = require('./log.js').log;

module.exports = function() {
   var app = connect()
   .use(denyNonPosts)
   .use(receiveBody)
   .use(connect.query())
   .use(extractParserOptions)
   .use('/session', createSession)
   .use(lookupSession)
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

function extractParserOptions(req, res, next) {
   if (req.query.options) {
      req.parserOptions = parserOptions(JSON.parse(req.query.options || null))
   }
   next();
}

function createSession(req, res, next) {
   sessions.create(req.body, req.parserOptions)
   .then(function(session) {
      res.end(session.token)
   }).fail(handleFailure(res, req));
}

function lookupSession(req, res, next) {
   if (req.query.session) {
      var session = sessions.get(req.query.session);
      if (!session || !session.ast) {
         var error = new Error("Session "+req.query.session+" not found!")
         return handleFailure(req, res)(error);
      }
      req.session = session;
   }
   next();
}

function convertLess(req, res, next) {
   getCssForRequest(req, res)
   .then(outputCss(req, res))
   .then(logRequest(req, res))
   .fail(handleFailure(req, res));
}

function getCssForRequest(req, res) {
   return parseLess(req)
   .then(includeSessionContents(req))
   .then(renderCss(req))
}

function handleFailure(req, res) {
   return function (err) {
      var message = less.formatError(err, {color:false})
      l("Got Error: " + req.url + "\n" +  message)
      res.statusCode = 500;
      res.end("" + message)
   }
}
   
function parseLess(req) {
   var deferred = Q.defer()
   var parser = new less.Parser(req.parserOptions);
   parser.parse(req.body, deferred.makeNodeResolver());
   return deferred.promise;
}

function includeSessionContents(req) {
   return function(ast) {
      if (req.session) {
         ast.rules = req.session.ast.rules.concat(ast.rules);
      }
      return ast;
   }
}

function outputCss(req, res) {
   return function (css) {
      res.writeHead(200, "Content-Type: text/css");
      res.end(css);
      return css;
   }
}

function renderCss(req) {
   return function (parseTree) {
      return parseTree.toCSS(req.parserOptions);
   };
}

function logRequest(req, res) {
   return function(css) {
      var time = process.hrtime(req.time);
      var ms = time[0]*1000 + time[1] / 1e6
      var outLength = Buffer.byteLength(css)
      var sizeMsg = round(req.body.length/1000) + "k -> " + round(outLength/1000) + "k"
      l("("+round(ms)+"ms - "+sizeMsg+"):" + req.url)
   }
}

function round(num, places) {
   var scale = Math.pow(10, places === undefined ? 1: places)
   return Math.round(num*scale)/scale
}

