module.exports = function() {
   let cache = {};
   return {
      get: function(key, callback) {
         callback(null, cache[key]);
      },

      set: function(key, value, expire, callback) {
         cache[key] = value;
         callback();
      },

      getCache: () => cache
   }
}
