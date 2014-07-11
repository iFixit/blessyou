## blessyou

[![Build
Status](https://travis-ci.org/iFixit/blessyou.png?branch=master)](https://travis-ci.org/iFixit/blessyou)

An http server that wraps the less compiler. POST your less and it will respond
with the CSS. But wait, there's more! blessyou also supports a reusable
"global" context of less definitions.

### Why?
Parsing less is pretty slow. Well, it's not that bad, but if you compile
thousands of files, starting a node.js process to compile each one is **slow**.
**blessyou** aims to fix that by making that node.js process long-lived and
turning it into an HTTP service.

### Simple Usage

    node server.js --port=8000

    # Then later
    $ curl --data-binary "a { b { color:red; } }" localhost:8000/
    a b {
      color: red;
    }


### Reusable Global Contexts (Sessions)

Let's say you use blessyou to compile 1000 less files and you have about 80KB
of mixin and variable definitions. The definitions would have to be prefixed to
each of those 1000 files during processing and thus that 80KB would have to be
repearsed a 1000 times needlessly.

Sessions allow you to create a *context* of less definitions identified by a
token which can be reused when compiling many less files. This speeds up the
process immensely, especially for small files.

    node server.js --port=8000

    # Then later, create the session by POSTing to /session. The response is
    # the token.
    $ token=`curl --data-binary ".red() { color: #ff0000; }" localhost:8000/session`

    # It can be reused as many times as you like.
    $ curl --data-binary "b { .red(); }" localhost:8000/?session=$token
    b {
      color: #FF0000;
    }

Sessions expire after an hour of unuse which should be enough for most cases.

