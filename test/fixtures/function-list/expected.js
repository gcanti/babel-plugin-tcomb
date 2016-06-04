import t from 'tcomb';

function foo(x: Array<t.String>) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function bar(x: t.String[]) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function baz(x: Array<string>) {
  _assert(x, t.list(t.String), 'x');

  return x;
}

function foobaz(x: Array<Promise<T>>) {
  _assert(x, t.list(Promise), 'x');

  return x;
}
