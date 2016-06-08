import t from 'tcomb';

function foo(a) {
  _assert(a, t.maybe(t.String), 'a');
}

function bar(a) {
  _assert(a, t.interface({
    b: t.maybe(t.String)
  }), 'a');
}
