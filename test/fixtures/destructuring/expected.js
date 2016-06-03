import t from 'tcomb';

function foo({ x }: { x: t.String }) {
  t.assert(t.is(arguments[0], t.interface({
    x: t.String
  })), 'Invalid argument arguments[0] (expected a ' + t.getTypeName(t.interface({
    x: t.String
  })) + ')');

  return bar;
}

function bar({ a } = {}): t.String {
  const ret = function ({ a }) {
    return x;
  }.call(this, { a });

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}