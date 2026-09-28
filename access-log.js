var log = require('./log.js');

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Connect middleware that logs one line per request, once the response is
 * finished (or the connection is closed), in the Combined Log Format with a
 * few blessyou-specific fields appended:
 *
 *    <remote-addr> - - [<date>] "<method> <url> HTTP/<version>" <status>
 *    <response-bytes> "<referer>" "<user-agent>" <time>ms in:<request-bytes>
 *    cache:<hit|miss|->
 */
module.exports = function accessLog(req, res, next) {
   var start = process.hrtime();
   var date = new Date();
   var logged = false;
   var bytesSent = 0;

   onBytesSent(res, function(bytes) {
      bytesSent += bytes;
   });

   res.on('finish', logRequest);
   res.on('close', logRequest);
   next();

   function logRequest() {
      if (logged) return;
      logged = true;
      // Looked up per call so tests can capture the output.
      log.log(formatLine(req, res, date, elapsedMs(start), bytesSent));
   }
};

function formatLine(req, res, date, ms, bytesSent) {
   return [
      req.socket.remoteAddress || '-',
      '-',
      '-',
      '[' + clfDate(date) + ']',
      quote(req.method + ' ' + (req.originalUrl || req.url) +
            ' HTTP/' + req.httpVersion),
      res.headersSent ? res.statusCode : '-',
      bytesSent || '-',
      quote(req.headers['referer'] || req.headers['referrer']),
      quote(req.headers['user-agent']),
      round(ms) + 'ms',
      'in:' + (req.body === undefined ? '-' : Buffer.byteLength(req.body)),
      'cache:' + cacheStatus(req)
   ].join(' ');
}

// Wraps res.write() and res.end() to report the size of each body chunk.
function onBytesSent(res, callback) {
   var write = res.write;
   var end = res.end;

   res.write = function(chunk, encoding) {
      count(chunk, encoding);
      return write.apply(this, arguments);
   };

   res.end = function(chunk, encoding) {
      if (chunk && typeof chunk !== 'function') {
         count(chunk, encoding);
      }
      return end.apply(this, arguments);
   };

   function count(chunk, encoding) {
      encoding = typeof encoding === 'string' ? encoding : undefined;
      callback(Buffer.byteLength(chunk, encoding));
   }
}

function cacheStatus(req) {
   if (req.fromCache === undefined) return '-';
   return req.fromCache ? 'hit' : 'miss';
}

// Wraps the value in quotes, escaping anything that could break the line
// apart (quotes, backslashes and control characters) as \xHH.
function quote(value) {
   if (value === undefined || value === null) return '"-"';
   return '"' + String(value).replace(/[\x00-\x1f\x7f"\\]/g, function(c) {
      return '\\x' + pad(c.charCodeAt(0).toString(16));
   }) + '"';
}

// 28/Sep/2026:21:20:00 +0000
function clfDate(date) {
   return pad(date.getUTCDate()) + '/' +
      MONTHS[date.getUTCMonth()] + '/' +
      date.getUTCFullYear() + ':' +
      pad(date.getUTCHours()) + ':' +
      pad(date.getUTCMinutes()) + ':' +
      pad(date.getUTCSeconds()) + ' +0000';
}

function elapsedMs(start) {
   var time = process.hrtime(start);
   return time[0]*1000 + time[1] / 1e6;
}

function pad(value) {
   return ('0' + value).slice(-2);
}

function round(num) {
   return Math.round(num*10)/10;
}
