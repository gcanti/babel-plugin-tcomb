const A = require("tcomb").interface({
  a: require("tcomb").String
}, "A");

const B = require("tcomb").interface.extend([A, {
  b: require("tcomb").String
}], "B");