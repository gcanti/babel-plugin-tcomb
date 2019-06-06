import t from 'tcomb';

class A {
  foo(x) {
    _assert(x, t.String, "x");

    const ret = function (x) {
      return x;
    }.call(this, x);

    _assert(ret, t.String, "return value");

    return ret;
  }

}

class B {
  bar() {
    [].forEach(n => {
      const ret = function (n) {
        console.log(this);
      }.call(this, n);

      _assert(ret, _t.Nil, "return value");

      return ret;
    });
  }

}
