const A = require("tcomb").inter({
  a: require("tcomb").String
}, "A");

const B = require("tcomb").inter.extend([A, {
  b: require("tcomb").String
}], "B");