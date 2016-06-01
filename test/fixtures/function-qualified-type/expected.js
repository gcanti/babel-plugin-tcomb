import t from 'tcomb';
function foo(x: a.b.c.User) {
  t.assert(t.is(x, a.b.c.User), 'Invalid argument x (expected a ' + t.getTypeName(a.b.c.User) + ')');

  return x;
}
