import t from 'tcomb';

function foo(x, y = 1) {
  _assert(x, t.Number, 'x');

  _assert(y, t.Number, 'y');

  return x + y;
}

function bar(x, y = 1) {
  _assert(x, t.Number, 'x');

  _assert(y, t.maybe(t.Number), 'y');

  return x + y;
}
