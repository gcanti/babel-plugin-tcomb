function foo(x : { foo: boolean, y: { bar: string }}) : { baz: boolean, a: { bob: string}} {
  return { baz: foo, a: { bob: bar} };
}

function getFullName(person: {name: string, surname: string}) {
  return `${name} ${surname}`;
}
