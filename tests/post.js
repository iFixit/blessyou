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
      deferred.resolve(getBody(res));
   });

   request.end(body);
   return deferred.promise;
}
