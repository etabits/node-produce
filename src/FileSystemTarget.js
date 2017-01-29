'use strict'

const fs = require('fs')
const stream = require('stream')
const path = require('path')

class DirectoryNestedWriter extends stream.Writable {
  constructor (base, options) {
    options = options || {}
    options.objectMode = true
    super(options)
    this.base = base
  }

  _write (chunk, encoding, callback) {
    var absPath = path.resolve(this.base, chunk.relPath)
    if (chunk.type === 'd') {
      fs.mkdir(absPath, function (error) {
        if (error && error.code !== 'EEXIST') {
          return callback(error)
        }
        callback()
      })
    } else {
      var writer = fs.createWriteStream(absPath)
      if (chunk.data) {
        return writer.end(chunk.data, callback)
      }
      fs.createReadStream(chunk.absPath).pipe(writer).on('finish', callback)
    }
  }
}

class FileSystem {
  constructor (base) {
    this.base = base
    this.writer = new DirectoryNestedWriter(base)
  }

  put (file) {
    debug('write requested', file.relPath)
    this.writer.write(file)
  }
}

module.exports = FileSystem

var debug = ((/^produce(:|$)/).test(process.env.DEBUG)) ? require('./debug') : () => {}
