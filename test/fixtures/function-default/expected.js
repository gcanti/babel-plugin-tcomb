import t from 'tcomb';

function foo(x: t.Number, y = 1: t.Number) {
  _assert(x, t.Number, 'x');

  _assert(y, t.Number, 'y');

  return x + y;
}

function bar(x: t.Number, y = 1) {
  _assert(x, t.Number, 'x');

  _assert(y, t.Number, 'y');

  return x + y;
}
