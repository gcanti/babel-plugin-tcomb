import t from 'tcomb';
const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  t.assert(Person.is(person));

  return person.name;
}