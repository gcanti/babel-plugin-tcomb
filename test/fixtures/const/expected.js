import _t from "tcomb";

const a = _assert('s1', _t.String, "a");

const aa = _assert('s1', _t.maybe(_t.String), "aa");

const b = 's2';

const [c] = _assert([1, 2], _t.list(_t.Number), "[c]");

const [d] = [];

const {
  e
} = _assert({
  e: 's3'
}, _t.interface({
  e: _t.String
}), "{ e }");

const {
  f
} = {};

const g = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), "g");

function h() {
  const x = _assert(1, _t.Any, "x");
}

class Klass1 {
  method1() {
    const x = _assert('a', _t.Any, "x");
  }

  method2() {
    const x = _assert('a', _t.union([_t.Any, _t.Any]), "x");
  }

}

const Predicate = _t.Function;

const i = _assert(() => {
  return true;
}, Predicate, "i");