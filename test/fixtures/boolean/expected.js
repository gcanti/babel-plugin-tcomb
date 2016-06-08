import t from 'tcomb';

function foo(x) {
  _assert(x, t.Boolean, 'x');

  return x;
}

function bar(x) {
  _assert(x, t.Boolean, 'x');

  return x;
}