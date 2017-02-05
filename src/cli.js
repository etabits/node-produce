'use strict'
const fs = require('fs')
const path = require('path')
const Module = require('module')

const Produce = require('./Produce')
const HTTPTarget = require('./HTTPTarget')

function cliRun (CWD, argv) {
  var argvStats = argv.map(function (dir) {
    try {
      return fs.statSync(dir)
    } catch (e) {
      return null
    }
  })

  var pConfig = {
    rules: []
  }

  var referenceModule = {
    paths: [path.join(CWD, 'node_modules')]
  }
  if (argvStats[0] && argvStats[0].isDirectory()) {
    pConfig.source = argv[0]
    let packageJSON = JSON.parse(fs.readFileSync(path.join(CWD, 'package.json')))
    let deps = Object.keys(Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies))
    let pluginsSettings = (packageJSON.produce && packageJSON.produce.plugins) || {}

    for (let moduleName of deps) {
      let normalizedPluginName = moduleName.replace(/^produce[-_.]/, '')
      let pSettings = pluginsSettings[normalizedPluginName] || {}
      try {
        let resolvedModulePath = Module._resolveFilename(moduleName, referenceModule)
        let resolvedModulePackageJSON = JSON.parse(fs.readFileSync(Module._resolveFilename(moduleName + '/package.json', referenceModule)))

        if (!resolvedModulePackageJSON.keywords || resolvedModulePackageJSON.keywords.indexOf('produce-rule') === -1) {
          continue
        }
        pConfig.rules.push(require(resolvedModulePath)(pSettings))
      } catch (e) {
        console.error(e.message)
      }
    }
  }

  if (argv.length === 2) {
    pConfig.target = argv[1]
  } else if (argv.length === 1) {
    pConfig.target = new HTTPTarget({port: process.env.PORT || 9000})
  }

  if (pConfig.source && pConfig.target) {
    var p = new Produce(pConfig)
    p.run()
  }
}

module.exports = cliRun
