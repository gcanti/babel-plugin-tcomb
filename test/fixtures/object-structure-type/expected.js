import t from 'tcomb';

function foo(x: { foo: t.Boolean; y: { bar: t.String }; }): { baz: t.Boolean; a: { bob: t.String }; } {
  t.assert(t.Object.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.Object) + ')');
  t.assert(t.Boolean.is(x.foo), 'Invalid argument x.foo (expected a ' + t.getTypeName(t.Boolean) + ')');
  t.assert(t.Object.is(x.y), 'Invalid argument x.y (expected a ' + t.getTypeName(t.Object) + ')');
  t.assert(t.String.is(x.y.bar), 'Invalid argument x.y.bar (expected a ' + t.getTypeName(t.String) + ')');

  var ret = (function (x) {
    return { baz: foo, a: { bob: bar } };
  }).call(this, x);

  t.assert(t.Object.is(ret), 'Invalid argument ret (expected a ' + t.getTypeName(t.Object) + ')');
  t.assert(t.Boolean.is(ret.baz), 'Invalid argument ret.baz (expected a ' + t.getTypeName(t.Boolean) + ')');
  t.assert(t.Object.is(ret.a), 'Invalid argument ret.a (expected a ' + t.getTypeName(t.Object) + ')');
  t.assert(t.String.is(ret.a.bob), 'Invalid argument ret.a.bob (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}
