var getBody = require('../get-body.js')
   ,Q    = require('q')
   ,http = require('http')

module.exports = function post(port, path, body) {
   var deferred = Q.defer();
   var request = http.request({
      host: 'localhost',
      port: port,
      path: path,
      method: 'POST'
   }, function(res) {
      var body = getBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
         deferred.resolve(body);
      } else {
         deferred.reject(body);
      }
   });

   request.end(body);
   return deferred.promise;
}
