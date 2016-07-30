import _t from "tcomb";
class A {
  foo(x) {
    _assert(x, _t.Any, "x");
  }
}

const P = _t.Number;


class B extends C {
  foo(x) {
    _assert(x, P, "x");
  }
}

class D extends E {
  foo(x) {
    _assert(x, _t.Any, "x");
  }
}

