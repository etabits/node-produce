'use strict'
import test from 'ava'

var utilities = require('../src/utilities')

test('automatically sets source/target functions', t => {
  t.plan(4)
  var _rule = {
    source: ['.jade', '.pug'],
    target: ['.html']
  }
  var rule = utilities.expandRule(Object.assign({}, _rule))

  t.is(rule.sourceTargets('in.potato'), null)
  t.deepEqual(rule.sourceTargets('/d/f.jade'), ['/d/f.html'])

  t.is(rule.targetSources('out.mash'), null)
  t.deepEqual(rule.targetSources('/d/f.html'), ['/d/f.jade', '/d/f.pug'])
})

test('do not automatically set source/target functions if set', t => {
  t.plan(4)
  var _rule = {
    // a function that takes a source and see if it matches, returning possible targets,
    // or it returns null
    // can be named source (short) or sourceTargets (unambiguous)
    source: (s) => /\.(jade|pug)$/.test(s) ? ['.html', '.htm'].map(t => s.replace(/\.(jade|pug)$/, t)) : null,
    // a function that takes a target and see if it matches, returning possible sources,
    // or it returns null
    // can be named target (short) or targetSources (unambiguous)
    targetSources: (t) => t.endsWith('.html') ? ['.pug', '.jade', '.tpl'].map(s => t.replace(/\.html$/, s)) : null
  }
  var rule = utilities.expandRule(Object.assign({}, _rule))

  t.is(rule.sourceTargets('in.potato'), null)
  t.deepEqual(rule.sourceTargets('f.jade'), ['f.html', 'f.htm'])

  t.is(rule.targetSources('out.mash'), null)
  t.deepEqual(rule.targetSources('f.html'), ['f.pug', 'f.jade', 'f.tpl'])
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
