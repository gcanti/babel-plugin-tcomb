const path   = require("path");
const fs     = require("fs");
const assert = require("assert");
const babel  = require("babel-core");
const plugin = require("../src/index").default;

function trim(str) {
  return str.replace(/^\s+|\s+$/, "");
}

const skipTests = {
  '.DS_Store': 1,
  'assert': 1
}

const fixturesDir = path.join(__dirname, "fixtures");

describe("assert", () => {
  it('should emit an _assert helper', () => {
    const actual = babel.transformFileSync(
        path.join(fixturesDir, "assert/actual.js"), {
          babelrc: false,
          plugins: [
            [plugin, {
              skipHelpers: false
            }],
            "syntax-flow"
          ]
        }
      ).code;
    const expected = fs.readFileSync(path.join(fixturesDir, "assert/expected.js")).toString();
    assert.equal(trim(actual), trim(expected));
  })
})

describe("emit type checks", () => {
  fs.readdirSync(fixturesDir).map((caseName) => {
    if ((caseName in skipTests)) {
      return;
    }
    if (!(caseName in { 'any': 1 })) {
      // return;
    }
    it(`should ${caseName.split("-").join(" ")}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actual = babel.transformFileSync(
        path.join(fixtureDir, "actual.js"), {
          babelrc: false,
          plugins: [
            [plugin, {
              skipHelpers: true
            }],
            "syntax-flow"
          ]
        }
      ).code;
      const expected = fs.readFileSync(path.join(fixtureDir, "expected.js")).toString();

      assert.equal(trim(actual), trim(expected));
    });
  });
});
