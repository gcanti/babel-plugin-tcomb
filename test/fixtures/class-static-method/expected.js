import t from 'tcomb';
class A {
  static f(x: t.String) {
    t.assert(t.String.is(x), function () {
      t.String(x);
      return 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')';
    });

    return x;
  }
}
