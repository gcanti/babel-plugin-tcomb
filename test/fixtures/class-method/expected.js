import t from 'tcomb';
class A {
  foo(x: t.String): t.String {
    t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

    const ret = function (x) {
      return x;
    }.call(this, x);

    t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
    return ret;
  }
}
