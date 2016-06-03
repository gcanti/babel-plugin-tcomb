import t from 'tcomb';

function foo(a?: string) {
  t.assert(t.is(a, t.maybe(t.String)), 'Invalid argument a (expected a ' + t.getTypeName(t.maybe(t.String)) + ')');
}

function bar(a: { b?: string }) {
  t.assert(t.is(a, t.interface({
    b: t.maybe(t.String)
  })), 'Invalid argument a (expected a ' + t.getTypeName(t.interface({
    b: t.maybe(t.String)
  })) + ')');
}
