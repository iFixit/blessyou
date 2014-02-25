## less-server

An http server that wraps the less compiler. POST your less and it will respond
with the CSS.

### Usage

    node server.js --port=8000

    # Then later
    $ curl --data-binary "a { b { color:red; } }" localhost:8000/
    a b {
      color: red;
    }

