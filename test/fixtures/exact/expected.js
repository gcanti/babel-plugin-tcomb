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

function f(x) {
  _assert(x, _t.interface({
    x: _t.String
  }, {
    strict: true
  }), "x");
}
function g() {
  const ret = function () {}.call(this);

  _assert(ret, _t.interface({
    x: _t.String
  }, {
    strict: true
  }), "return value");

  return ret;
}
function h(x) {
  _assert(x, _t.interface({
    x: _t.String
  }, {
    strict: true
  }), "x");
}
function i() {
  const ret = function () {}.call(this);

  _assert(ret, _t.interface({
    x: _t.String
  }, {
    strict: true
  }), "return value");

  return ret;
}
