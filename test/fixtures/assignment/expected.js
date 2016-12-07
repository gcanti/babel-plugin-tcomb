import _t from "tcomb";
let a = _assert(s1, _t.String, "a");
a = _assert(s2, _t.String, "a");
let aa = _assert(s1, _t.maybe(_t.String), "aa");
aa = _assert(s2, _t.maybe(_t.String), "aa");
let aaa;
aaa = _assert(s2, _t.String, "aaa");
let b = s1;
b = s2;

let [c] = _assert([n1, n2], _t.list(_t.Number), "[c]");
c = _assert(n3, _t.Number, "c");

let { e } = _assert({ e: s3 }, _t.interface({
  e: _t.String
}), "{ e }");
e = _assert(s4, _t.String, "e");
let { f } = {};

let g = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), "g");

function h() {
  let x = _assert(1, _t.Any, "x");
  x = _assert(2, A, "x");
}

class Klass1 {
  method1() {
    let x = _assert(a, _t.Any, "x");
    x = _assert(b, A, "x");
  }
  method2() {
    let x = _assert(a, _t.union([_t.Any, _t.Any]), "x");
    x = _assert(b, _t.union([A, B]), "x");
  }
}

const Predicate = _t.Function;

let i = _assert(() => {
  return true;
}, Predicate, "i");
i = _assert(() => {
  return false;
}, Predicate, "i");
