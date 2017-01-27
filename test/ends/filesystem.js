'use strict'
import test from 'ava'

const stream = require('stream')
const fs = require('fs')
const path = require('path')

const FileSystemSource = require('../../src/FileSystemSource')
const FileSystemTarget = require('../../src/FileSystemTarget')

const fsr = new FileSystemSource(path.join(__dirname, '../'))

var targetDirectory = path.resolve(__dirname, '../../tmp/test')

const __basename = path.basename(__filename)
const __relname = path.join(path.basename(__dirname), __basename)

test.cb.before(t => fs.mkdir(path.resolve(__dirname, '../empty'), () => t.end()))
test.cb.before(t => fs.mkdir(targetDirectory, () => t.end()))
test.after(t => fs.rmdir(path.resolve(__dirname, '../empty'), () => {}))

test.cb('source.list', t => {
  t.plan(4)
  var listReader = fsr.list()
  t.true(listReader instanceof stream.Readable)

  listReader.on('data', function (f) {
    if (f.type === 'd' && f.relPath === 'ends') {
      t.pass('found directory')
    }
    if (f.type === 'd' && f.relPath === 'empty') {
      t.pass('found empty dir')
    }
    if (f.type === 'f' && f.relPath === __relname) {
      t.pass('found file')
    }
  }).on('end', () => t.end())
})

test.cb('source.get', t => {
  t.plan(4)
  fsr.get(__relname, function (err, result) {
    t.is(err, null)
    t.true(result.reader instanceof stream.Readable)
    t.is(result.absPath, __filename)
    result.reader.on('data', function (data) {
      t.is("'use strict'\n", data.toString().substr(0, 13))
      t.end()
    })
  })
})

test.todo('source.get non existing file')
test.todo('source.get directory')

test.cb('pipe', t => {
  var fsw = new FileSystemTarget(path.resolve(targetDirectory, 'pipe'))

  t.plan(2)
  fsr.list()
  .pipe(fsw.writer)
  .on('finish', () => {
    fs.readFile(path.resolve(targetDirectory, 'pipe', __relname), function (error, data) {
      t.is(error, null)
      t.is("'use strict'\n", data.toString().substr(0, 13))
      t.end()
    })
  })
})

test.cb('manual', t => {
  t.plan(4)
  var fsw = new FileSystemTarget(path.resolve(targetDirectory, 'manual'))
  fsr.get(__relname, (error, result) => {
    t.is(error, null)
    t.is(result.type, 'f')
    fsw.put({
      relPath: '.',
      type: 'd'
    })
    fsw.put({
      relPath: '1',
      type: 'd'
    })
    fsw.put({
      relPath: '1/2',
      type: 'd'
    })
    result.relPath = '1/2/test.js'
    fsw.put(result)
    fsw.writer.end(function () {
      fs.readFile(path.resolve(targetDirectory, 'manual/1/2/test.js'), function (error, data) {
        t.is(error, null)
        t.is("'use strict'\n", data.toString().substr(0, 13))
        t.end()
      })
    })
  })
})

test.cb('target.put', t => {
  t.plan(2)
  var fsw = new FileSystemTarget(path.resolve(targetDirectory, 'put'))
  fsw.put({
    relPath: '.',
    type: 'd'
  })
  fsw.put({
    relPath: 'file.txt',
    absPath: __filename
  })
  fsw.writer.end(function () {
    fs.readFile(path.resolve(targetDirectory, 'put/file.txt'), function (error, data) {
      t.is(error, null)
      t.is("'use strict'\n", data.toString().substr(0, 13))
      t.end()
    })
  })
})
