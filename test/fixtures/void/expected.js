import t from 'tcomb';

function foo(): void {
  const ret = function () {}.call(this);

  t.assert(t.is(ret, t.Nil), 'Invalid argument ret (expected a ' + t.getTypeName(t.Nil) + ')');
  return ret;
}

function bar(): null {
  const ret = function () {}.call(this);

  t.assert(t.is(ret, t.Nil), 'Invalid argument ret (expected a ' + t.getTypeName(t.Nil) + ')');
  return ret;
}