var Q    = require('q')
   ,connect = require('connect')
   ,http = require('http')
   ,less = require('less')
   ,getBody = require('./get-body.js')
   ,parserOptions = require('./parser-options.js')
   ,sessions = require('./sessions.js')()
   ,DummyCache = require('./dummy-cache.js')
   ,accessLog = require('./access-log.js')
   ,l    = require('./log.js').log;

module.exports = function(config) {
   var cache = null;

   var app = connect()
   .use(accessLog)
   .use(denyNonPosts)
   .use(receiveBody)
   .use(connect.query())
   .use(extractParserOptions)
   .use('/session', createSession)
   .use(lookupSession)
   .use(convertLess)

   cache = config && config.cache;
   if (!cache) {
      l("Using Dummy Cache");
      cache = DummyCache;
   }

   const server = http.createServer(app)
   server.on('close', () => {
      sessions.close();
   });
   return server;

   function denyNonPosts(req, res, next) {
      if (req.method !== 'POST') {
         res.statusCode = 404;
         return res.end();
      }
      next();
   }

   function receiveBody(req, res, next) {
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
      }).catch(handleFailure(res, req));
   }

   function lookupSession(req, res, next) {
      if (req.query.session) {
         var session = sessions.get(req.query.session);
         if (!session || !session.ast) {
            var error = "Session "+req.query.session+" not found!";
            return handleFailure(req, res)(error);
         }
         req.session = session;
      }
      next();
   }

   function convertLess(req, res, next) {
      getCssForRequest(req, res)
      .then(outputCss(req, res))
      .catch(handleFailure(req, res));
   }

   function getCssForRequest(req, res) {
      return cache.getCachedResponse(req)
      .then(function(cachedCss) {
         return cachedCss || parseAndRenderCss(req)
      })
   }

   function parseAndRenderCss(req) {
      return parseLess(req)
      .then(includeSessionContents(req))
      .then(renderCss(req))
      .then(storeInCache(req))
   }

   function handleFailure(req, res) {
      return function (err) {
         var message = less.formatError(err, {color:false})
         l("Got Error: " + req.url + "\n" +  message)
         l(err);
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

   function storeInCache(req) {
      return function(css) {
         return cache.setCachedResponse(req, css)
      };
   }
}
