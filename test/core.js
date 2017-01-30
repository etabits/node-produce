'use strict'
import test from 'ava'

const path = require('path')
const fs = require('fs')

const FileSystemSource = require('../src/FileSystemSource')
const FileSystemTarget = require('../src/FileSystemTarget')

const Produce = require('../src/Produce')

var targetDirectory = path.resolve(__dirname, '../tmp_test')

var p = new Produce({
  source: new FileSystemSource('./src'),
  target: new FileSystemTarget(path.join(targetDirectory, 'src_hash')),
  rules: [
    {
      source: ['.js'],
      target: ['.info', '.js.md5'],
      via: [
        {stream: function () {
          var hash = 'sha1'
          if (this.output.relPath.endsWith('.md5')) {
            hash = 'md5'
          }
          return require('crypto').createHash(hash)
        }},
        function (buf) {
          return this.input.relPath + ':' + buf.toString('hex')
        }
      ]
    }
  ]
})

test.cb.before(t => fs.mkdir(targetDirectory, () => t.end()))

test.cb('build', t => {
  p.run()
  p.target.writer.on('finish', function () {
    fs.readFile(path.resolve(targetDirectory, 'src_hash/Produce.info'), function (error, data) {
      t.is(error, null)
      t.true(/^Produce\.js:[0-9a-f]{40}$/.test(data.toString()))
      t.end()
    })
  })
})
