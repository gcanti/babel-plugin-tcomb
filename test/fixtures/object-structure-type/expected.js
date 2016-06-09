import t from 'tcomb';
function foo(x) {
  _assert(x, t.interface({
    foo: t.Boolean,
    y: t.interface({
      bar: t.String
    })
  }), 'x');

  const ret = function (x) {
    return { baz: foo, a: { bob: bar } };
  }.call(this, x);

  _assert(ret, t.interface({
    baz: t.Boolean,
    a: t.interface({
      bob: t.String
    })
  }), 'return value');

  return ret;
}

function getFullName(person) {
  _assert(person, t.interface({
    name: t.String,
    surname: t.String
  }), 'person');

  return `${ name } ${ surname }`;
}
