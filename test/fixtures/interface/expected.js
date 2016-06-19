import _t from "tcomb";

const A = _t.interface({
  a: _t.String
}, "A");

const B = _extend([A, {
  b: _t.String
}], "B");

const C = _extend([A, {}], "C");

const D = _extend([A, _t.refinement(_t.interface({}), p)], "D");

const E = _extend([A, {
  e: _t.Any
}], "E");

const F = _extend([E, {
  e: _t.Any,
  f: _t.Any
}], "F");