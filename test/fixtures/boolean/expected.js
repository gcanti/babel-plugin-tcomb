import t from 'tcomb';

function foo(x: bool) {
  _assert(x, t.Boolean, 'x');

  return x;
}

function bar(x: bool) {
  _assert(x, t.Boolean, 'x');

  return x;
}