var parserproxy = require('parserproxy')
  , forever = require('forever')
  , request = require('request');

forever.start(parserproxy).on('start', function (process, data){

  // It takes a few milliseconds for the http server to spin up, so for the purposes of this 
  // example, we wrap the request in a setTimeout(). You DON'T need to do this in your code unless
  // you are going to make one or more requests immediately upon start up.

  setTimeout(function(){
    request({ uri : 'http://localhost:3030/parseFeed',
              body : { url: 'http://cyber.law.harvard.edu/rss/examples/rss2sample.xml' },
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
