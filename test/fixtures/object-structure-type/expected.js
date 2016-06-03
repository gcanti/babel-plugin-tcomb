import t from 'tcomb';
function foo(x: { foo: t.Boolean; y: { bar: t.String }; }): { baz: t.Boolean; a: { bob: t.String }; } {
  t.assert(t.is(x, t.interface({
    foo: t.Boolean,
    y: t.interface({
      bar: t.String
    })
  })), 'Invalid argument x (expected a ' + t.getTypeName(t.interface({
    foo: t.Boolean,
    y: t.interface({
      bar: t.String
    })
  })) + ')');

  const ret = function (x) {
    return { baz: foo, a: { bob: bar } };
  }.call(this, x);

  t.assert(t.is(ret, t.interface({
    baz: t.Boolean,
    a: t.interface({
      bob: t.String
    })
  })), 'Invalid argument ret (expected a ' + t.getTypeName(t.interface({
    baz: t.Boolean,
    a: t.interface({
      bob: t.String
    })
  })) + ')');
  return ret;
}

function getFullName(person: { name: t.String; surname: t.String; }) {
  t.assert(t.is(person, t.interface({
    name: t.String,
    surname: t.String
  })), 'Invalid argument person (expected a ' + t.getTypeName(t.interface({
    name: t.String,
    surname: t.String
  })) + ')');

  return `${ name } ${ surname }`;
}
