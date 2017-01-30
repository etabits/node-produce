'use strict'

const line = require('line')

var utilities = {}

utilities.expandRule = function (rule) {
  if (!rule.sourceTargets) {
    rule.sourceTargets = (typeof rule.sources === 'function') ? rule.sources : utilities.autoHandlers.sourceTargets
  }

  if (!rule.targetSources) {
    rule.targetSources = (typeof rule.targets === 'function') ? rule.targets : utilities.autoHandlers.targetSources
  }

  if (Array.isArray(rule.via)) {
    rule.via = line(rule.via)
  }

  return rule
}

utilities.autoHandlers = {}
utilities.autoHandlers.sourceTargets = function (source) {
  for (var i = 0, len = this.sources.length; i < len; ++i) {
    if (source.endsWith(this.sources[i])) {
      return this.targets
    }
  }
  return null
}
utilities.autoHandlers.targetSources = function (target) {
  for (var i = 0, len = this.targets.length; i < len; ++i) {
    if (target.endsWith(this.targets[i])) {
      return this.sources
    }
  }
  return null
}

module.exports = utilities
