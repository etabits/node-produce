'use strict'
import test from 'ava'

var utilities = require('../src/utilities')

test('automatically sets source/target functions', t => {
  t.plan(4)
  var _rule = {
    sources: ['.jade', '.pug'],
    targets: ['.html']
  }
  var rule = utilities.expandRule(Object.assign({}, _rule))

  t.is(rule.sourceTargets('in.potato'), null)
  t.deepEqual(rule.sourceTargets('in.jade'), _rule.targets)

  t.is(rule.targetSources('out.mash'), null)
  t.deepEqual(rule.targetSources('out.html'), _rule.sources)
})

test('do not automatically set source/target functions if set', t => {
  t.plan(4)
  var _rule = {
    // a function that takes a source and see if it matches, returning possible targets,
    // or it returns null
    sources: (s) => /\.(jade|pug)$/.test(s) ? ['.html', '.htm'] : null,
    // a function that takes a target and see if it matches, returning possible sources,
    // or it returns null
    targets: (t) => t.endsWith('.html') ? ['.pug', '.jade', '.tpl'] : null
  }
  var rule = utilities.expandRule(Object.assign({}, _rule))

  t.is(rule.sourceTargets('in.potato'), null)
  t.deepEqual(rule.sourceTargets('in.jade'), ['.html', '.htm'])

  t.is(rule.targetSources('out.mash'), null)
  t.deepEqual(rule.targetSources('out.html'), ['.pug', '.jade', '.tpl'])
})

test('automatically expands array .via', t => {
  t.plan(1)

  var _rule = {
    via: [
      (v) => v * 2,
      (v) => Promise.resolve(v * 3),
      (v, done) => process.nextTick(() => done(null, v * 7))
    ]
  }
  var rule = utilities.expandRule(Object.assign({}, _rule))

  return rule.via(1).then(function (result) {
    t.is(result, 42)
  })
})
