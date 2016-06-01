import t from 'tcomb';

function foo(): mixed {
  const ret = function () {}.call(this);

  t.assert(t.is(ret, t.Any), 'Invalid argument ret (expected a ' + t.getTypeName(t.Any) + ')');
  return ret;
}