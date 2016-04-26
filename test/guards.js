const path   = require("path");
const fs     = require("fs");
const assert = require("assert");
const babel  = require("babel-core");
const plugin = require("../src/index").default;

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
