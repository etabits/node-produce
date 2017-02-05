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
      source: ['.js'],
      target: ['.js.sha1', '.js.md5'],
      mimeType: 'text/x-hash',
      via: [
        {stream: function () {
          var hash = 'sha1'
          if (this.output.relPath.endsWith('.md5')) {
            this.output.mimeType = 'text/x-short-hash'
            hash = 'md5'
          }
          return require('crypto').createHash(hash)
        }}
      ]
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
    var self = this
    http.get('http://localhost:9000' + url, function (res) {
      self.res = res
      done(null, res)
    })
  },
  function (buf) {
    this.buf = buf
    return this
  }
])

test('request', t => {
  t.plan(2)
  return httpGet('/http.js.sha1')
  .then(function (result) {
    t.regex(result.res.headers['content-type'], /^text\/x-hash/)
    t.is(result.buf.length, 20)
  })
})

test('request alt ext', t => {
  t.plan(2)
  return httpGet('/http.js.md5')
  .then(function (result) {
    // console.log(result.res.headers['content-type'], /^text\/x-short-hash/)
    t.regex(result.res.headers['content-type'], /^text\/x-short-hash/)
    t.is(result.buf.length, 16)
  })
})

test.todo('http errors')
