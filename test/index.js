/* global describe,it */
const path   = require('path')
const fs     = require('fs')
const assert = require('assert')
const babel  = require('babel-core')
const plugin = require('../src/index').default

function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

const skipTests = {
  '.DS_Store': 1,
  'assert': 1
}

const fixturesDir = path.join(__dirname, 'fixtures')

describe('_assert helper', () => {

  it('should emit an _assert helper compatible with the current scope', () => {
    const source = `import t from 'tcomb';
function _assert(){}
function foo(x: string) {}
`
    const expected = `import t from 'tcomb';
function _assert() {}
function foo(x: string) {
  _assert2(x, t.String, 'x');
}

function _assert2(x, type, name) {
  type = type || t.Any;

  if (t.isType(type) && type.meta.kind !== 'struct') {
    type(x, [name + ': ' + t.getTypeName(type)]);
  } else if (!(x instanceof type)) {
    t.fail('Invalid value ' + t.stringify(x) + ' supplied to ' + name + ' (expected a ' + t.getTypeName(type) + ')');
  }

  return x;
}`
    const actual = babel.transform(
      source, {
        babelrc: false,
        plugins: [
          'syntax-flow',
          plugin
        ]
      }
    ).code
    assert.equal(actual, expected)
  })

  it('should not emit an _assert helper if there are no asserts', () => {
    const source = `function foo(x) {}`
    const expected = `function foo(x) {}`
    const actual = babel.transform(
      source, {
        babelrc: false,
        plugins: [
          'syntax-flow',
          plugin
        ]
      }
    ).code
    assert.equal(actual, expected)
  })

})

describe('refinements', () => {

  it('should error when a $Refinement interface is defined by the user', () => {
    const source = `
    interface $Refinement {}
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            'syntax-flow',
            plugin
          ]
        }
      )
    }, err => {
      if ((err instanceof Error) &&
        /\$Refinement is a reserved interface name for babel-plugin-tcomb/.test(err.message) ) {
        return true
      }
    })
  })

  it('should error when a $Refinement type is defined by the user', () => {
    const source = `
    type $Refinement = any;
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            'syntax-flow',
            plugin
          ]
        }
      )
    }, err => {
      if ((err instanceof Error) &&
        /\$Refinement is a reserved interface name for babel-plugin-tcomb/.test(err.message) ) {
        return true
      }
    })
  })

})

describe('reify', () => {

  it('should error when a $Reify interface is defined by the user', () => {
    const source = `
    interface $Reify {}
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            'syntax-flow',
            plugin
          ]
        }
      )
    }, err => {
      if ((err instanceof Error) &&
        /\$Reify is a reserved interface name for babel-plugin-tcomb/.test(err.message) ) {
        return true
      }
    })
  })

  it('should error when a $Reify type is defined by the user', () => {
    const source = `
    type $Reify = any;
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            'syntax-flow',
            plugin
          ]
        }
      )
    }, err => {
      if ((err instanceof Error) &&
        /\$Reify is a reserved interface name for babel-plugin-tcomb/.test(err.message) ) {
        return true
      }
    })
  })

})

describe('emit asserts for: ', () => {
  fs.readdirSync(fixturesDir).map((caseName) => {
    if ((caseName in skipTests)) {
      return
    }
    if (!(caseName in { 'class-generics': 1 })) {
      // return
    }
    it(`should ${caseName.split('-').join(' ')}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName)
      const actual = babel.transformFileSync(
        path.join(fixtureDir, 'actual.js'), {
          babelrc: false,
          plugins: [
            'syntax-flow',
            [plugin, {
              skipHelpers: true
            }],
            'transform-flow-strip-types'
          ]
        }
      ).code
      const expected = fs.readFileSync(path.join(fixtureDir, 'expected.js')).toString()

      assert.equal(trim(actual), trim(expected))
    })
  })
})
