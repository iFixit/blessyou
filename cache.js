module.exports = function Cache(config) {
   return {
      getCachedResponse: function(req) {
         return new Promise(function(resolve, reject) {
            req.fromCache = false;
            req.cacheKey = getCacheKey(req.session, req.body, req.parserOptions);
            resolve(null);
         })
      },

      setCachedResponse: function(req, css) {
         if (req.fromCache) {
            return css;
         }
         return new Promise(function(resolve, reject) {
            resolve(css);
         })
      }
   }
}

function getCacheKey(session, lessCode, parseOptions) {
   return md5([lessCode, JSON.stringify(parseOptions) || '']);
}

function md5(strings) {
   var crypto = require('crypto');
   var hasher = crypto.createHash('md5');
   strings.forEach(string => hasher.update(String(string)));
   return hasher.digest('hex');
}
