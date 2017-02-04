#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const Module = require('module')

const Produce = require('./src/Produce')

const CWD = process.cwd()
const referenceModule = {
  paths: [path.join(CWD, 'node_modules')]
}
const argv = process.argv.slice(2)
const argvStats = argv.map(function (dir) {
  try {
    return fs.statSync(dir)
  } catch (e) {
    return null
  }
})

var pConfig = {
  rules: []
}
if (argvStats[0] && argvStats[0].isDirectory()) {
  pConfig.source = argv[0]
  let packageJSON = JSON.parse(fs.readFileSync(path.join(CWD, 'package.json')))
  let deps = Object.keys(Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies))

  for (let moduleName of deps) {
    try {
      let resolvedModulePath = Module._resolveFilename(moduleName, referenceModule)
      let resolvedModulePackageJSON = JSON.parse(fs.readFileSync(Module._resolveFilename(moduleName + '/package.json', referenceModule)))

      if (!resolvedModulePackageJSON.keywords || resolvedModulePackageJSON.keywords.indexOf('produce-rule') === -1) {
        continue
      }
      pConfig.rules.push(require(resolvedModulePath)())
    } catch (e) {
      console.error(e.message)
    }
  }
}

if (argv.length === 2) {
  pConfig.target = argv[1]
} else if (argv.length === 1) {
  const HTTPTarget = require('./src/HTTPTarget')
  pConfig.target = new HTTPTarget({port: process.env.PORT || 9000})
}

if (pConfig.source && pConfig.target) {
  var p = new Produce(pConfig)
  p.run()
}
