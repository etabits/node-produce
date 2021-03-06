'use strict'

const line = require('line')

var utilities = {}

utilities.expandRule = function (rule) {
  if (typeof rule.source === 'string') rule.source = [rule.source]
  if (!rule.sourceTargets) {
    rule.sourceTargets = (typeof rule.source === 'function') ? rule.source : utilities.autoHandlers.sourceTargets
  }

  if (typeof rule.target === 'string') rule.target = [rule.target]
  if (!rule.targetSources) {
    rule.targetSources = (typeof rule.target === 'function') ? rule.target : utilities.autoHandlers.targetSources
  }

  if (Array.isArray(rule.via)) {
    rule.via = line(rule.via)
  }

  return rule
}

utilities.autoHandlers = {}
utilities.autoHandlers.sourceTargets = function (source) {
  for (var i = 0, len = this.source.length; i < len; ++i) {
    if (source.endsWith(this.source[i])) {
      var basename = source.substr(0, source.length - this.source[i].length)
      return this.target.map(addSuffix(basename))
    }
  }
  return null
}
utilities.autoHandlers.targetSources = function (target) {
  for (var i = 0, len = this.target.length; i < len; ++i) {
    if (target.endsWith(this.target[i])) {
      var basename = target.substr(0, target.length - this.target[i].length)
      return this.source.map(addSuffix(basename))
    }
  }
  return null
}

utilities.colorize = (str, color) => `\u001b[${colors.indexOf(color) + 30}m${str}\u001b[39m`
utilities.stylize = (str, s) => `\u001b[${styles[s][0]}m${str}\u001b[${styles[s][1]}m`

utilities.getStringRelative = function (from, to) {
  var segments = segment(from)
  var common = ''
  for (var s of segments) {
    if (!to.startsWith(s)) break
    common += s
    to = to.substr(s.length)
    from = from.substr(s.length)
  }

  return {common, from, to}
}

var addSuffix = (basename) => (suffix) => basename + suffix

const colors = [null, 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
const styles = {
  crossed: [9, 29],
  bold: [1, 22]
}

const rx = /(^\/)?[^./]+(\.|\/|$)/g
function segment (p) {
  var segments = []
  for (var m; (m = rx.exec(p)) !== null; segments.push(m[0]));

  return segments
}

module.exports = utilities
