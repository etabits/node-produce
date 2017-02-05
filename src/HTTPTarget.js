'use strict'

const http = require('http')

const codes = require('./codes')
const utilities = require('./utilities')

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
      HTTPTarget.logRequest(res.statusCode, req.url, time, len)
      res.end(data)
    })
    .catch(function (error) {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
      var resp, mresp
      if (error.code === codes.NOT_FOUND) {
        res.statusCode = 404
        resp = 'File Not Found'
        mresp = ''
      } else {
        var err = error.error || error
        res.statusCode = 500
        resp = err.stack || err.message
        mresp = err.message
      }
      HTTPTarget.logRequest(res.statusCode, req.url, mresp)
      res.end(resp)
    })
  }

  run (callback) {
    this.server.listen(this.opts.port, callback)
    console.log(`Listening at http://127.0.0.1:${this.opts.port}/`)
  }

  static logRequest (code, url) {
    var color = 'magenta'
    if (code >= 500) color = 'red'
    else if (code >= 400) color = 'yellow'
    else if (code === 203) color = 'green'
    else if (code === 200) color = 'cyan'

    var logArguments = [
      `${utilities.colorize(code, color)} ${url}`
    ].concat(Array.from(arguments).slice(2))

    console.log.apply(null, logArguments)
  }
}

module.exports = HTTPTarget

var debug = ((/^produce(:|$)/).test(process.env.DEBUG)) ? require('./debug') : () => {}
