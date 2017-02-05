'use strict'

const http = require('http')

class HTTPTarget {
  constructor (opts) {
    this.opts = opts
    this.server = http.createServer(this.requestHandler.bind(this))
  }

  requestHandler (req, res) {
    debug('http: got request', req.url)
    this.produce.process({
      output: {
        relPath: req.url
      }
    })
    .then(function (result) {
      // TODO log request urls like any server would do
      debug('http: processed request', req.url)

      var mimeType = result.output.mimeType || result.rule.mimeType
      if (mimeType) {
        res.statusCode = 203
        res.setHeader('Content-Type', mimeType + '; charset=UTF-8')
      }
      res.end(result.output.data)
    })
    .catch(error => console.error(error))
  }

  run (callback) {
    this.server.listen(this.opts.port, callback)
    console.log(`Listening at http://127.0.0.1:${this.opts.port}/`)
  }
}

module.exports = HTTPTarget

var debug = ((/^produce(:|$)/).test(process.env.DEBUG)) ? require('./debug') : () => {}
