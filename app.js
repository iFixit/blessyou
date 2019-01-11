var BlessYou = require('./server.js')
   ,yargs= require('yargs')
   ,argv = args()
   ,fs   = require('fs')
   ,Cache = require('./cache.js')
   ,l    = console.log;

function args() {
   return yargs.usage("Usage: $0 --port=<port> [--host=<host-ip>] [--pid-file=path]")
      .describe('port', 'tcp port to run the http server on.')
      .demand('port')
      .describe('host', 'tcp host to accept connections from.')
      .default('host', '127.0.0.1')
      .describe('memcache-server', 'i.e. 127.0.0.1:11211')
      .describe('memcache-expire-time', 'expire time in seconds for compiled css stored in memcache')
      .describe('pid-file', 'file path to save the current pid in')
      .argv
}

function getCacheFromArgs() {
   if (argv['memcache-server']) {
      const memcache = {
         server: argv['memcache-server'],
         expireTime: argv['memcache-expire-time']
      }

      l("Using memcache");
      return Cache(memcache);
   }
}

argv.cache = getCacheFromArgs()

var server = new BlessYou(argv);

server.listen(argv.port, argv.host, function() {
   l("http server listening on: " + argv.host + ":" + argv.port); 
});

if (argv['pid-file']) {
   fs.writeFileSync(argv['pid-file'], process.pid)
}

