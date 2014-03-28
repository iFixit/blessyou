var less = require('less')
   ,Q    = require('q')
   ,parserOptions = require('./parser-options.js')
   ,expireTime = 60 * 60 * 1000 // one hour

module.exports = function() {
   var sessions = {};
   return {
      create: getOrCreateAst,
      get: getSession
   };

   function getOrCreateAst(lessCode, parseOverrides) {
      var token = md5(lessCode);
      
      return Q.when(
       getSession(token) ||
       createSession(lessCode, parseOverrides, token));
   }

   function createSession(lessCode, parseOverrides, token) {
      return parseLess(lessCode, parseOverrides).then(function(syntaxTree) {
         sessions[token] = {
            token: token,
            ast: syntaxTree,
            expires: getExpires()
         };
         return sessions[token];
      });
   }

   function getSession(token) {
      var session = sessions[token];

      if (session) {
         session.expires = getExpires();
      }

      return session;
   }

   // Setup session expiration
   setInterval(function() {
      var now = Date.now();
      Object.keys(sessions).forEach(function(token) {
         if (sessions[token].expires > now) {
            delete sessions[token];
         }
      });
   }, 60 * 1000);
}


function parseLess(lessCode, parseOverrides) {
   var deferred = Q.defer()
   var parser = new less.Parser(parserOptions(parseOverrides));
   parser.parse(lessCode, deferred.makeNodeResolver());
   return deferred.promise;
}

function md5(string) {
   var crypto = require('crypto');
   var hasher = crypto.createHash('md5');
   hasher.update(string);
   return hasher.digest('base64');
}

function getExpires() {
   return Date.now() + expireTime;
}
