import t from 'tcomb';

function foo(p: Promise<string>): void {
  t.assert(t.is(p, Promise), 'Invalid argument p (expected a ' + t.getTypeName(Promise) + ')');

  const ret = function (p) {}.call(this, p);

  t.assert(t.is(ret, t.Nil), 'Invalid argument ret (expected a ' + t.getTypeName(t.Nil) + ')');
  return ret;
}