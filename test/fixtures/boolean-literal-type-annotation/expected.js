import _t from "tcomb";

const A = _t.union([_t.String, _t.refinement(_t.Boolean, function (b) {
  return b === true;
})], "A");