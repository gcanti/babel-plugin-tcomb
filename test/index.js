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
  'function-destructuring': 1,
  'function-default': 1
}

describe("emit type checks", () => {
  const fixturesDir = path.join(__dirname, "fixtures");
  fs.readdirSync(fixturesDir).map((caseName) => {
    if ((caseName in skipTests)) {
      return;
    }
    // if (!(caseName in {'function-default': 1})) {
    //   return;
    // }
    it(`should ${caseName.split("-").join(" ")}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actual     = babel.transformFileSync(
        path.join(fixtureDir, "actual.js"), {
          babelrc: false,
          plugins: ["syntax-flow", plugin]
        }
      ).code;
      const expected = fs.readFileSync(path.join(fixtureDir, "expected.js")).toString();

      assert.equal(trim(actual), trim(expected));
    });
  });
});
