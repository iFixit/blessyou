var BlessYou = require('./server.js')
   ,yargs= require('yargs')
   ,argv = args()
   ,fs   = require('fs')
   ,l    = console.log;

var server = new BlessYou();

function args() {
   return yargs.usage("Usage: $0 --port=<port> [--host=<host-ip>] [--pid-file=path]")
      .describe('port', 'tcp port to run the http server on.')
      .demand('port')
      .describe('host', 'tcp host to accept connections from.')
      .default('host', '127.0.0.1')
      .describe('pid-file', 'file path to save the current pid in')
      .argv
}

server.listen(argv.port, argv.host, function() {
   l("http server listening on: " + argv.host + ":" + argv.port); 
});

if (argv['pid-file']) {
   fs.writeFileSync(argv['pid-file'], process.pid)
}

