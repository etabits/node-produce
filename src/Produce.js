'use strict'

const fs = require('fs')

const utilities = require('../src/utilities')

class Produce {
  constructor (opts) {
    this.source = opts.source
    this.target = opts.target
    this.rules = opts.rules.map(utilities.expandRule)
  }

  getRule (io) {
    var self = this
    // If we have input, all we need to do is to find a matching rule
    if (io.input) {
      var outputsPolicy = 'all'
      // There should be outputsPolicy: one | rule | all | one!?
      io.outputs = []
      for (let r of this.rules) {
        var targets = r.sourceTargets(io.input.relPath)
        if (targets) {
          for (let i = 0, len = targets.length; i < len; ++i) {
            io.outputs.push({
              type: io.input.type,
              relPath: targets[0],
              rule: r
            })
            if (outputsPolicy === 'one') return Promise.resolve()
          }
          if (outputsPolicy === 'rule') return Promise.resolve()
        }
      }
      if (!io.outputs.length && outputsPolicy) {
        io.outputs.push({
          type: io.input.type,
          relPath: io.input.relPath
        })
      }
      return Promise.resolve()
    }
    // No input! We will have to search for candidates
    var candidates = []
    for (let rule of this.rules) {
      var sources = rule.targetSources(io.output.relPath)
      if (sources) {
        for (let i = 0, len = sources.length; i < len; ++i) {
          candidates.push({fname: sources[i], rule})
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
      if (!io.output) {
        io.output = io.outputs[0]
        io.rule = io.output.rule
      }
      if (input.type === 'd') {
        debug('ISDIR', io)
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

  run (callback) {
    var self = this

    if (typeof self.target.run === 'function') {
      self.target.produce = self
      return self.target.run(callback)
    }

    var total = 0
    var processed = 0
    var sourceEnded = false
    self.source.list()
    .on('data', function (input) {
      debug('got read', total, 'for file', input.relPath)
      ++total
      self.process({input}).then((io) => {
        debug('engine: sending write to target', processed)
        ++processed
        self.target.put(io.output)
        if (sourceEnded && processed === total) {
          debug('last write, source ended')
          self.target.writer.end()
        }
      })
      .catch(error => console.error(error))
    })
    .on('end', function () {
      debug('source list ended with ', total, 'elements')
      sourceEnded = true
    })
    // self.target.writer.on('finish', callback)
  }
}

module.exports = Produce

var debug = ((/^produce(:|$)/).test(process.env.DEBUG)) ? require('./debug') : () => {}
