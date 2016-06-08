import t from 'tcomb';

const Person = t.struct({
  name: t.String
});

function foo(person) {
  _assert(person, Person, 'person');

  return person.name;
}
