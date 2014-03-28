## blessyou

[![Build
Status](https://travis-ci.org/iFixit/blessyou.png?branch=master)](https://travis-ci.org/iFixit/blessyou)

An http server that wraps the less compiler. POST your less and it will respond
with the CSS.

### Usage

    node server.js --port=8000

    # Then later
    $ curl --data-binary "a { b { color:red; } }" localhost:8000/
    a b {
      color: red;
    }

Less parser options can be passed through using this psedocode:

    var options = {
       compress: false
       // any other options less supports
    };
    var lessCode = "a { b { color:red; } }";
    
    options = encodeUriComponent(JSON.stringify(options));
    var css = post("localhost:8000/?options=" + options, lessCode)

If you want a set of less variables or mixin definitions to be available to a
bunch of future requests, do this:

    var token = post("localhost:8000/session", ".bold() { font-weight: bold; }")
    // Then later use the token as many times as you want and your less will be
    // executed in the cotext of the code from the session POST.
    var css = post("localhost:8000/?session=" + token, "p { .bold() }")
   
Note: session tokens expire after an hour.
