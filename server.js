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
  
  function parseFeed (url, callback){
    request(url, function (err, response, body){
      if (err) callback(err);
      else if (response.statusCode >= 400) callback(response.statusCode);
      else {
        var parser = new FeedParser();
        parser.parseString(body, callback);
      }
    });
  }
  
  function parseOpml (url, callback){
    request(url, function (err, response, body){
      if (err) callback(err);
      else if (response.statusCode >= 400) callback(response.statusCode);
      else {
        var parser = new OpmlParser();
        parser.parseString(body, callback);
      }
    });
  }
  
  var server = http.createServer(function (req, res) {
    var data = '';
    req.body = {};
  
    req.on('data', function (buffer){
      data += (buffer.toString('utf8'));
    });
    req.on('end', function (){
      req.body = JSON.parse(data);
      switch (req.url) {
        case '/parseFeed':
          parseFeed(req.body.url, function (err, meta, articles){
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
          });
          break;
        case '/parseOpml':
          parseOpml(req.body.url, function (err, meta, feeds, outline){
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
          });
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