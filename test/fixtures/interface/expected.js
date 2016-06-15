import _t from "tcomb";

const A = _t.interface({
  a: _t.String
}, "A");

const B = _extend([A, {
  b: _t.String
}], "B");

const C = _extend([A, {}], "C");

const D = _extend([A, _t.refinement(_t.interface({}), p)], "D");