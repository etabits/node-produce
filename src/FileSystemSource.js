'use strict'

const fs = require('fs')
const path = require('path')
const stream = require('stream')

class DirectoryNestedReader extends stream.Readable {
  constructor (base, options) {
    options = options || {}
    options.objectMode = true
    super(options)
    this.base = base
    debug('instantiated with base=', base)
    this.files = [{
      relPath: '.',
      absPath: this.base,
      type: 'd'
    }]
    this.directories = this.files.slice(0)
  }

  _read () {
    debug('read requested')
    this.$read()
  }

  $read () {
    var self = this
    debug('internal read requested')

    if (self.files.length) {
      debug('consuming from files', self.files.length)
      while (self.files.length > 0 && self.push(self.files.shift()));
      debug('done consuming', self.files.length)
    } else if (!self.files.length && self.directories.length) {
      var dir = self.directories.shift()
      debug('consuming from directory', dir.absPath)
      fs.readdir(dir.absPath, function (error, mixedFiles) {
        if (error) {
          return self.emit('error', error)
        }

        var totalElements = mixedFiles.length
        debug('got', totalElements, 'elements')
        if (totalElements === 0) {
          return self.$read()
        }
        var processedElements = 0
        var statHandler = function (relPath) {
          var absPath = path.resolve(self.base, relPath)
          debug('stating', relPath)
          fs.stat(absPath, function (error, stat) {
            if (error) {
              return self.emit('error', error)
            }

            var obj = {
              stat,
              relPath,
              absPath,
              type: stat.isDirectory() ? 'd' : 'f'
            }
            if (obj.type === 'd') {
              self.directories.push(obj)
            }
            self.files.push(obj)
            if (++processedElements === totalElements) {
              self.$read()
            }
          })
        }
        for (var i = 0; i < mixedFiles.length; ++i) statHandler(path.join(dir.relPath, mixedFiles[i]))
      })
    } else {
      this.push(null)
    }
  }
}

class FileSystem {
  constructor (base) {
    this.base = path.resolve(process.cwd(), base)
  }

  list () {
    return new DirectoryNestedReader(this.base)
  }

  get (file) {
    if (typeof file === 'string') {
      file = {
        relPath: file
      }
    }
    file.relPath = path.normalize(file.relPath)
    file.absPath = path.join(this.base, file.relPath)
    if (!file.absPath.startsWith(this.base)) {
      // FIXME better error message
      throw new Error('Crossed base boundary')
    }

    return new Promise(function (resolve, reject) {
      if (file.stat) return resolve(file)
      fs.stat(file.absPath, (error, stat) => {
        if (error) {
          if (error.code === 'ENOENT') {
            return resolve()
          }
          return reject(error)
        }
        file.type = stat.isDirectory() ? 'd' : 'f'
        resolve(file)
      })
    })
  }
}

module.exports = FileSystem

var debug = ((/^produce(:|$)/).test(process.env.DEBUG)) ? require('./debug') : () => {}
