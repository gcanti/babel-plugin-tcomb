/* global describe,it */
const path   = require("path")
const fs     = require("fs")
const assert = require("assert")
const babel  = require("babel-core")
const plugin = require("../src/index").default

function trim(str) {
  return str.replace(/^\s+|\s+$/, "")
}

const skipTests = {
  '.DS_Store': 1,
  'assert': 1
}

const stripTypes = {
  'class-generics': 1,
  'function-generics': 1
}

const fixturesDir = path.join(__dirname, "fixtures")

describe("_assert helper", () => {
  it('should emit an _assert helper', () => {
    const actual = babel.transformFileSync(
        path.join(fixturesDir, "assert/actual.js"), {
          babelrc: false,
          plugins: [
            "syntax-flow",
            [plugin, {
              skipHelpers: false
            }]
          ]
        }
      ).code
    const expected = fs.readFileSync(path.join(fixturesDir, "assert/expected.js")).toString()
    assert.equal(trim(actual), trim(expected))
  })
})

describe("refinements", () => {
  it('should error when a Refinement interface is defined by the user', () => {
    const source = `
    interface $Refinement {}
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            "syntax-flow",
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
  it('should error when a Refinement type is defined by the user', () => {
    const source = `
    type $Refinement = any;
    `

    assert.throws(() => {
      babel.transform(
        source, {
          babelrc: false,
          plugins: [
            "syntax-flow",
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

describe("export type", () => {
  it('should not strip the exported type', () => {
    const source = `export type A = {};`
const expected = `export const A = require("tcomb").interface({}, "A");`

    const actual = babel.transform(
      source, {
        babelrc: false,
        plugins: [
          [plugin, {
            skipHelpers: true
          }],
          'transform-flow-strip-types'
        ]
      }
    ).code
    assert.strictEqual(actual, expected)
  })
  it('should not strip the exported interface', () => {
    const source = `export interface A {}`
const expected = `export const A = require("tcomb").interface({}, "A");`

    const actual = babel.transform(
      source, {
        babelrc: false,
        plugins: [
          [plugin, {
            skipHelpers: true
          }],
          'transform-flow-strip-types'
        ]
      }
    ).code
    assert.strictEqual(actual, expected)
  })
})

describe("import type", () => {
  it('should not strip the imported type', () => {
    const source = `import type { A } from "./types";`
const expected = `import { A } from "./types";`

    const actual = babel.transform(
      source, {
        babelrc: false,
        plugins: [
          [plugin, {
            skipHelpers: true
          }],
          'transform-flow-strip-types'
        ]
      }
    ).code
    assert.strictEqual(actual, expected)
  })
})

describe("emit asserts for: ", () => {
  fs.readdirSync(fixturesDir).map((caseName) => {
    if ((caseName in skipTests)) {
      return
    }
    if (!(caseName in { '$shape': 1 })) {
      // return
    }
    it(`should ${caseName.split("-").join(" ")}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName)
      const plugins = [
        "syntax-flow",
        [plugin, {
          skipHelpers: true
        }]
      ]
      if (caseName in stripTypes) {
        plugins.push('transform-flow-strip-types')
      }
      const actual = babel.transformFileSync(
        path.join(fixtureDir, "actual.js"), {
          babelrc: false,
          plugins
        }
      ).code
      const expected = fs.readFileSync(path.join(fixtureDir, "expected.js")).toString()

      assert.equal(trim(actual), trim(expected))
    })
  })
})
