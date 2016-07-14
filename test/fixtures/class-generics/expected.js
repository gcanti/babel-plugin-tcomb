import _t from "tcomb";

const Type = _t.interface({
  test: _t.String
}, "Type");

class A {
  foo(x) {
    _assert(x, _t.Any, "x");

    let y = _assert(x, _t.Any, "y");
    y = _assert(x, _t.Any, "y");
  }
}

class B {
  foo(x) {
    _assert(x, Type, "x");

    const y = _assert(x, Type, "y");
  }
}

class C extends B {
  foo(x) {
    _assert(x, Type, "x");

    const y = _assert(x, Type, "y");
  }
}

class D extends E {
  foo(x) {
    _assert(x, F, "x");

    const y = _assert(x, F, "y");
  }
}
