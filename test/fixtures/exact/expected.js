import _t from "tcomb";

const A = _t.interface({
  x: _t.String
}, {
  name: "A",
  strict: true
});

const B = _t.interface({
  x: _t.String
}, {
  name: "B",
  strict: true
});
