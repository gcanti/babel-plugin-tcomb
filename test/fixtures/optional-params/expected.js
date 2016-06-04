import t from 'tcomb';

function foo(a?: string) {
  _assert(a, t.maybe(t.String), 'a');
}

function bar(a: { b?: string }) {
  _assert(a, t.interface({
    b: t.maybe(t.String)
  }), 'a');
}
