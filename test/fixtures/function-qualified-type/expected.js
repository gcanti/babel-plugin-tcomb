import t from 'tcomb';

function foo(x: a.b.c.User) {
  t.assert(a.b.c.User.is(x), function () {
    a.b.c.User(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(a.b.c.User) + ')';
  });

  return x;
}
