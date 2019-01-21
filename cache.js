const l = require('./log.js').log;

module.exports = function Cache(config) {
   const memcache = config.memcache;
   const expireTime = config.expireTime || 86400;

   return {
      // Returns a promise for the value from cache (null on a miss)
      getCachedResponse: function(req) {
         return new Promise(function(resolve, reject) {
            req.cacheKey = getCacheKey(req);
            memcache.get(req.cacheKey, (err, data) => {
               req.fromCache = !!(!err && data);
               if (err) {
                  l("Cache error: " + err);
               }
               resolve(data || null);
            });
         })
      },

      // Stores the value in the cache and returns a promise to the same value
      setCachedResponse: function(req, css) {
         return new Promise(function(resolve, reject) {
            if (req.fromCache) {
               return resolve(css);
            }
            memcache.set(req.cacheKey, css, expireTime, (err, data) => {
               resolve(css);
            });
         })
      }
   }
}

function getCacheKey(req) {
   return md5([
      req.session && req.session.token,
      req.body,
      JSON.stringify(req.parserOptions) || ''
   ]);
}

function md5(strings) {
   var crypto = require('crypto');
   var hasher = crypto.createHash('md5');
   strings.forEach(string => hasher.update(String(string)));
   return hasher.digest('hex');
}
