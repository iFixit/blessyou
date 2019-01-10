module.exports = {
   getCachedResponse: function(req) {
      return new Promise(function(resolve, reject) {
         resolve(null);
      })
   },

   setCachedResponse: function(req, css) {
      return new Promise(function(resolve, reject) {
         resolve(css);
      })
   }
}
