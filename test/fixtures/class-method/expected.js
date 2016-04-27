import t from 'tcomb';
class A {
  foo(x: t.String): t.String {
    t.assert(t.String.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

    var ret = function (x) {
      return x;
    }.call(this, x);

    t.assert(t.String.is(ret), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
    return ret;
  }
}
