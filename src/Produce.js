'use strict'

const fs = require('fs')

class Produce {
  constructor (opts) {
    this.source = opts.source
    this.target = opts.target
    this.rules = opts.rules
  }

  getRule (io) {
    var self = this
    // If we have input, all we need to do is to find a matching rule
    if (io.input) {
      io.output = {
        type: io.input.type
      }
      for (let r of this.rules) {
        if (r.source.test(io.input.relPath)) {
          io.output.relPath = io.input.relPath.replace(r.source, r.defaultTarget)
          io.rule = r
          return Promise.resolve()
        }
      }
      io.output.relPath = io.input.relPath
      return Promise.resolve()
    }
    // No input! We will have to search for candidates
    var candidates = []
    for (let r of this.rules) {
      if (r.target.test(io.output.relPath)) {
        for (let ext of r.sourceExpansions) {
          candidates.push({
            fname: io.output.relPath.replace(r.target, ext),
            rule: r,
            ext: ext
          })
        }
      }
    }
    var promises = candidates.map(function (c) {
      return self.source.get(c.fname)
    })
    return Promise.all(promises)
    .then(function (results) {
      var select
      for (var i = 0; i < results.length; ++i) {
        if (!results[i]) continue
        select = i
        break
      }
      io.input = results[select]
      io.rule = candidates[select].rule
    })
  }

  process (io) {
    var self = this

    return self.getRule(io)
    .then(function () {
      return self.source.get(io.input)
    })
    .then(function (input) {
      if (input.type === 'd') {
        self.log('ISDIR', io)
        return
      } else if (!io.rule) {
        io.output.reader = io.input.reader
        return
      }
      return io.rule.via(fs.createReadStream(input.absPath), io)
    })
    .then(function (data) {
      io.output.data = data
      return io
    })
    // .catch(error => {
    //   console.error(error)
    // })
  }

  run () {
    var self = this

    if (typeof self.target.run === 'function') {
      self.target.produce = self
      return self.target.run()
    }

    self.source.list().on('data', function (input) {
      self.process({input}).then((io) => {
        self.target.put(io.output)
      })
      .catch(error => console.error(error))
    })
  }

  log () {}
}

module.exports = Produce;

/* jshint ignore:start */
((/(^|,)produce(:|$)/).test(process.env.DEBUG)) && require('./src/debug')(Produce)
/* jshint ignore:end */
