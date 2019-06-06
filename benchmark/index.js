var Benchmark = require('benchmark')
var babel  = require('@babel/core')
var plugin = require('../src/index').default
var path = require('path')
var fs = require('fs')

function getHz(bench) {
  var result = 1 / (bench.stats.mean + bench.stats.moe)
  return isFinite(result) ? result : 0
}

function onComplete() {
  this.forEach(function (bench) {
    console.log(bench.name + ' ' + getHz(bench) + ' ops/sec') // eslint-disable-line no-console
  })
}

var source = fs.readFileSync(path.join(__dirname, 'source.js')).toString()

function Test() {
  return babel.transform(
    source, {
      babelrc: false,
      plugins: [
        '@babel/plugin-syntax-flow',
        [plugin, {
          skipAsserts: false
        }],
        '@babel/plugin-transform-flow-strip-types'
      ]
    }
  ).code
}

Benchmark.Suite({ })
  .add('Test', Test)
  .on('complete', onComplete)
  .run({ async: true })
