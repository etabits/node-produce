'use strict'

const http = require('http')

class HTTPTarget {
  constructor (opts) {
    this.opts = opts
    this.server = http.createServer(this.requestHandler.bind(this))
  }

  requestHandler (req, res) {
    this.produce.process({
      output: {
        relPath: req.url
      }
    })
    .then(function (result) {
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
