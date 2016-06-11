import t from 'tcomb';

const Person = t.struct({
  name: t.String
});

function foo(person) {
  _assert(person, typeof Person !== "undefined" ? Person : _t.Any, 'person');

  return person.name;
}
