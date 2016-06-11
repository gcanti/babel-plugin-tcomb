import _t from "tcomb";

const A = _t.interface({
  a: _t.String
}, "A");

const B = _t.interface.extend([A, {
  b: _t.String
}], "B");

const C = _t.interface.extend([A, {}], "C");

const D = _t.interface.extend([A, _t.refinement(_t.interface({}), p)], "D");