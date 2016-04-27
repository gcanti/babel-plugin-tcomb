const path   = require("path");
const fs     = require("fs");
const assert = require("assert");
const babel  = require("babel-core");
const plugin = require("../src/index").default;

function trim(str) {
  return str.replace(/^\s+|\s+$/, "");
}

const skipTests = {
  '.DS_Store': 1
}

describe("ensure guards", () => {
  describe("tcomb import guarding", () => {
    it(`should error when type checking`, () => {
      const source = `
        function foo(x: t.String) {
          return x;
        }`;

      assert.throws(() => {
        babel.transform(
          source, {
            babelrc: false,
            plugins: [plugin, "syntax-flow"]
          }
        )
      }, err => {
        if ((err instanceof Error) &&
          /you must have an import of tcomb/.test(err) ) {
          return true;
        }
      });
    });

    it(`should NOT error when NOT type checking`, () => {
      const source = `
        function foo(x) {
          return x;
        }`;

      assert.doesNotThrow(() => {
        babel.transform(
          source, {
            babelrc: false,
            plugins: [plugin, "syntax-flow"]
          }
        )
      });
    });
  });
});


describe("emit type checks", () => {
  const fixturesDir = path.join(__dirname, "fixtures");
  fs.readdirSync(fixturesDir).map((caseName) => {
    if ((caseName in skipTests)) {
      return;
    }
    it(`should ${caseName.split("-").join(" ")}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actual     = babel.transformFileSync(
        path.join(fixtureDir, "actual.js"), {
          babelrc: false,
          plugins: [plugin, "syntax-flow"]
        }
      ).code;
      const expected = fs.readFileSync(path.join(fixtureDir, "expected.js")).toString();

      assert.equal(trim(actual), trim(expected));
    });
  });
});
