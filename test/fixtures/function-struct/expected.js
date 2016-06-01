import t from 'tcomb';

const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  t.assert(t.is(person, Person), 'Invalid argument person (expected a ' + t.getTypeName(Person) + ')');

  return person.name;
}
