import t from 'tcomb';

function foo(p: Promise<string>): void {
  _assert(p, Promise, 'p');

  const ret = function (p) {}.call(this, p);

  _assert(ret, t.Nil, 'return value');

  return ret;
}