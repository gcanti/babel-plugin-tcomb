import t from 'tcomb';

function foo(): any {
  var ret = function () {}.call(this);

  t.assert(t.is(ret, t.Any), 'Invalid argument ret (expected a ' + t.getTypeName(t.Any) + ')');
  return ret;
}