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
      if (!chunk.reader) {
        chunk.reader = fs.createReadStream(chunk.absPath)
      }
      chunk.reader.pipe(fs.createWriteStream(absPath))
      .on('finish', callback)
    }
  }
}

class FileSystem {
  constructor (base) {
    this.base = base
    this.writer = new DirectoryNestedWriter(base)
  }

  put (file) {
    this.writer.write(file)
  }
}

module.exports = FileSystem
