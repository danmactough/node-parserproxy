#  Parserproxy - A JSON-over-HTTP proxy for node-feedparser and node-opmlparser 
      
This module acts as a proxy that fetches an RSS/Atom/RDF or OPML url that you
request, parses it -- using
[node-feedparser](https://github.com/danmactough/node-feedparser) or
[node-opmlparser](https://github.com/danmactough/node-opmlparser) -- and
responds with the parsed JSON representation of the RSS/Atom/RDF or OPML you
requested.

This module was created so that I could easily transform what is frequently a
time-intensive, blocking operation -- i.e., XML parsing -- into an I/O operation
(in a separate process, maybe on another server), which means the parsing will
no longer be blocking.

## Requirements

- [node-feedparser](https://github.com/danmactough/node-feedparser)
- [node-opmlparser](https://github.com/danmactough/node-opmlparser)
- [request](https://github.com/mikeal/request)

## Installation

Via npm:

    npm install parserproxy

Manually: (A fine idea if you're not going to use in programatically in your node.js program)

    git clone git://github.com/danmactough/node-parserproxy.git parserproxy

## Example

### Manually

    $ cd parserproxy
    $ node server.js

Then in your node app:

    var request = require('request');
    request({ method : 'POST',
              uri : 'http://localhost:3030/parseFeed',
              body : { url: 'http://cyber.law.harvard.edu/rss/examples/rss2sample.xml' },
              json : true },
              function (err, response, body){
                if (!err && response.statusCode == 200) {
                  console.log('%s [%s]', body.meta.title || body.meta.xmlUrl, body.meta.link);
                  body.articles.forEach(function (article) {
                    console.log('%s - %s', article.pubDate, article.title || article.description.substring(0,50));
                  });
                }
                else {
                  console.log("Either couldn't connect to parserproxy or it failed.");
                }
              });

### Programatically

    var parserproxy = require('parserproxy')
      , forever = require('forever')
      , request = require('request');
    
    forever.start(parserproxy).on('start', function (process, data){
    
      // It takes a few milliseconds for the http server to spin up, so for the purposes of this 
      // example, we wrap the request in a setTimeout(). You DON'T need to do this in your code unless
      // you are going to make one or more requests immediately upon start up.
    
      setTimeout(function(){
        request({ method : 'POST',
                  uri : 'http://localhost:3030/parseFeed',
                  body : { url: 'http://scripting.com/rss.xml' },
                  json : true },
                  function (err, response, body){
                    if (!err && response.statusCode == 200) {
                      console.log('%s [%s]', body.meta.title || body.meta.xmlUrl, body.meta.link);
                      body.articles.forEach(function (article) {
                        console.log('%s - %s', article.pubDate, article.title || article.description.substring(0,50));
                      });
                    }
                  });
      }, 1000);
    });

## To-do

Obviously, a pluggable memcache-like ability would be great. Pull requests always welcome. :-)

## License 

(The MIT License)

Copyright (c) 2011 Dan MacTough &lt;danmactough@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
