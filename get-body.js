var Q    = require('q')

module.exports = function readEntireBody(stream) {
   var deferred = Q.defer()
   var body = ''
   stream.setEncoding('utf8')
   stream.on('data', function (chunk) {
      body += chunk
   });
   stream.on('end', function () {
      deferred.resolve(body);
   });
   stream.on('close', function (err) {
      deferred.reject(err);
   });
   return deferred.promise;
}

