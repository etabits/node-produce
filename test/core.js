'use strict'
import test from 'ava'

const path = require('path')
const fs = require('fs')

const line = require('line')

const FileSystemSource = require('../src/FileSystemSource')
const FileSystemTarget = require('../src/FileSystemTarget')

const Produce = require('../src/Produce')

var targetDirectory = path.resolve(__dirname, '../tmp_test')

var p = new Produce({
  source: new FileSystemSource('./test/fixtures/core'),
  target: new FileSystemTarget(path.join(targetDirectory, 'core')),
  rules: [
    {
      source: ['.txt'],
      target: ['.txt.sha1', '.txt.md5'],
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

test('build', t => {
  t.plan(3)
  p.run()
  return new Promise(function (resolve, reject) {
    p.target.writer.on('finish', resolve)
  }).then(function () {
    return line([{
      another: (v, done) => void fs.readFile(path.resolve(targetDirectory, 'core/another.ext'), 'utf8', done),
      sha1: (v, done) => void fs.readFile(path.resolve(targetDirectory, 'core/etabits.txt.sha1'), 'utf8', done),
      md5: (v, done) => void fs.readFile(path.resolve(targetDirectory, 'core/etabits.txt.md5'), 'utf8', done)
    }])().then(function (results) {
      t.is(results.sha1, 'etabits.txt:1958d8b896c2764f4e76dd35d29054994d8c671c')
      t.is(results.md5, 'etabits.txt:4d4e4e73bc4d4535b6126a6bb161eb5e')
      t.is(results.another, 'Another!\n')
    })
  })
})
