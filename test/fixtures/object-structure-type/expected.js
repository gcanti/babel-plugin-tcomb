import t from 'tcomb';
function foo(x: { foo: t.Boolean; y: { bar: t.String }; }): { baz: t.Boolean; a: { bob: t.String }; } {
  t.assert(t.is(x, t.inter({
    foo: t.Boolean,
    y: t.inter({
      bar: t.String
    })
  })), 'Invalid argument x (expected a ' + t.getTypeName(t.inter({
    foo: t.Boolean,
    y: t.inter({
      bar: t.String
    })
  })) + ')');

  var ret = function (x) {
    return { baz: foo, a: { bob: bar } };
  }.call(this, x);

  t.assert(t.is(ret, t.inter({
    baz: t.Boolean,
    a: t.inter({
      bob: t.String
    })
  })), 'Invalid argument ret (expected a ' + t.getTypeName(t.inter({
    baz: t.Boolean,
    a: t.inter({
      bob: t.String
    })
  })) + ')');
  return ret;
}

function getFullName(person: { name: t.String; surname: t.String; }) {
  t.assert(t.is(person, t.inter({
    name: t.String,
    surname: t.String
  })), 'Invalid argument person (expected a ' + t.getTypeName(t.inter({
    name: t.String,
    surname: t.String
  })) + ')');

  return `${ name } ${ surname }`;
}
