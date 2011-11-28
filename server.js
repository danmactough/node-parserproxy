/*!
 * node-parserproxy - A JSON-over-HTTP proxy for node-feedparser and node-opmlparser
 * Copyright(c) 2011 Dan MacTough <danmactough@gmail.com>
 * All rights reserved.
 */

/**
 * Module dependencies.
 */
var http = require('http')
  , url = require('url')
  , request = require('request')
  , FeedParser = require('feedparser')
  , OpmlParser = require('opmlparser')
  ;

if (!module.parent) {

  var port = process.env['PARSER_PROXY_PORT'] || 3030;
  
  process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err);
  });
  
  var server = http.createServer(function (req, res) {
    var data = '';
    req.body = {};
  
    req.on('data', function (buffer){
      data += (buffer.toString('utf8'));
    });

    req.on('end', function (){

      if (req.method != 'POST') {
        res.statusCode = 501; // Not implemented
        return res.end();
      }

      if (req.headers['content-type'] == 'application/json') {
        req.body = JSON.parse(data);
      } else if (req.headers['content-type'] == 'application/xml' || 
                 req.headers['content-type'] == 'text/xml' || 
                 req.headers['content-type'] == 'text/x-opml' || 
                 req.headers['content-type'] == 'application/rss+xml') {
        req.body = data;
      } else {
        res.statusCode = 501; // Not implemented
        return res.end();
      }

      function _parse (parser, string, response, callback){
        if (typeof response == 'function') {
          callback = response;
          response = null;
        }
        if (response) {
          parser.parseString(string, function (err, meta, articles_or_feeds, outline){
            if (err) callback(err);
            else {
              meta.response = { headers: response.headers,
                                statusCode: response.statusCode,
                                request: { uri: response.request.uri,
                                           redirects: response.request.redirects} };
              if (!outline) callback(err, meta, articles_or_feeds);
              else callback(err, meta, articles_or_feeds, outline);
            }
          });
        } else {
          parser.parseString(string, callback);
        }
      }
    
      function _request (parser, url, callback){
        request(url, function (err, response, body){
          if (err) callback(err);
          else if (response.statusCode >= 400) callback(response.statusCode);
          else _parse(parser, body, response, callback);
        });  
      }

      switch (req.url) {
        case '/parseFeed':
          var parser = new FeedParser()
            , respond = function (err, meta, articles){
                if (err) {
                  if (+err >= 400) {
                    res.statusCode = err;
                  } else {
                    res.writeHead(500, err.message || err);
                  }
                  res.end();
                } else {
                  res.writeHead(200, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ meta: meta, articles: articles }));
                }
              };

          if (typeof req.body == 'string') _parse(parser, req.body, respond);
          else _request(parser, req.body, respond);

          break;
        case '/parseOpml':
          var parser = new OpmlParser()
            , respond = function (err, meta, feeds, outline){
                if (err) {
                  if (+err >= 400) {
                    res.statusCode = err;
                  } else {
                    res.writeHead(500, err.message || err);
                  }
                  res.end();
                } else {
                  res.writeHead(200, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({ meta: meta, feeds: feeds, outline: outline }));
                }
              };

          if (typeof req.body == 'string') _parse(parser, req.body, respond);
          else _request(parser, req.body, respond);

          break;
        default:
          res.statusCode = 501; // Not implemented
          res.end();
          break;
      }
    });

    req.on('error', function (err){
      res.writeHead(500, err.message || err);
      res.end();
    });
  }).listen(port, function(){
    console.log("Proxy parser server listening on port %d", port);
  });
} else {
  module.exports = __dirname + '/server.js';
}