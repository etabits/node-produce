'use strict'

const http = require('http')

class HTTPTarget {
  constructor (opts) {
    this.opts = opts
    this.server = http.createServer(this.requestHandler.bind(this))
  }

  requestHandler (req, res) {
    debug('http: got request', req.url)
    var io = {
      output: {
        relPath: req.url
      }
    }
    var start = Date.now()
    this.produce.process(io)
    .then(function (result) {
      debug('http: processed request', req.url)

      var mimeType = result.output.mimeType || result.rule.mimeType
      if (mimeType) {
        res.statusCode = 203
        res.setHeader('Content-Type', mimeType + '; charset=UTF-8')
      }

      var data = result.output.data
      var len = data.length + ((typeof data === 'string') ? 'c' : 'b')
      var time = (Date.now() - start) + 'ms'
      console.log(`${res.statusCode} ${req.url}`, time, len)
      res.end(data)
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
