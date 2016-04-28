import t from 'tcomb';
function foo(x : { foo: t.Boolean, y: { bar: t.String }}) : { baz: t.Boolean, a: { bob: t.String}} {
  return { baz: foo, a: { bob: bar} };
}

function getFullName(person: {name: t.String, surname: t.String}) {
  return `${name} ${surname}`;
}
