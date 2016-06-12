const path = require('path')
const babel  = require('babel-core')
const plugin = require('../src/index').default
const fs = require('fs')

const code = babel.transformFileSync(path.join(__dirname, '../src/index.js'), {
  babelrc: false,
  presets: ["es2015"],
  plugins: [
    'syntax-flow',
    plugin,
    'transform-flow-strip-types'
  ]
}).code
fs.writeFileSync(path.join(__dirname, '../lib/index.js'), code)