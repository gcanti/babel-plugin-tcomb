import t from 'tcomb';

function foo(x: Array<t.String>) {
  return x;
}

function bar(x: t.String[]) {
  return x;
}

function baz(x: Array<string>) {
  return x;
}

function foobaz(x: Array<Promise<T>>) {
  return x;
}
