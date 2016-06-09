import t from "tcomb";

const A = t.interface({
  a: t.String
}, "A");
const B = t.interface.extend([A, {
  b: t.String
}], "B");
const C = t.interface.extend([A, {}], "C");
const D = t.interface.extend([A, t.refinement(t.interface({}), p)], "D");