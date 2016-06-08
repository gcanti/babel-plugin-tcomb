import t from 'tcomb';

function foo(x) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function bar(x) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function baz(x) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function foobaz(x) {
  _assert(x, t.list(Promise), 'x');

  return x;
}
