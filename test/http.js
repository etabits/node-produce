'use strict'
import test from 'ava'

const http = require('http')
const line = require('line')

const PORT = 9000
const FileSystemSource = require('../src/FileSystemSource')

const HTTPTarget = require('../src/HTTPTarget')
const Produce = require('../src/Produce')

var p = new Produce({
  source: new FileSystemSource(__dirname),
  target: new HTTPTarget({port: PORT}),
  rules: [
    {
      source: /\.js$/,
      sourceExpansions: ['.js', '.potato'],
      target: /\.js.(md5|sha1)$/,
      targetExpansions: ['.js.sha1', 'js.md5'],
      defaultTarget: '.js.sha1',
      via: line([
        {stream: function () {
          var hash = 'sha1'
          if (this.output.relPath.endsWith('.md5')) {
            hash = 'md5'
          }
          return require('crypto').createHash(hash)
        }}
      ])
    }
  ]
})
test.before.cb(t => {
  p.run(t.end)
})
test.after.cb(t => {
  p.target.server.close(t.end)
})
var httpGet = line([
  function (url, done) {
    http.get('http://localhost:9000' + url, (res) => done(null, res))
  }
])

test.cb('request', t => {
  httpGet('/http.js.sha1')
  .then(function (buf) {
    t.is(buf.length, 20)
    t.end()
  })
})

test.cb('request alt ext', t => {
  httpGet('/http.js.md5')
  .then(function (buf) {
    t.is(buf.length, 16)
    t.end()
  })
})
