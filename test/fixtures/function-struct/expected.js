import t from 'tcomb';

const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  t.assert(Person.is(person), function () {
    Person(person);
    return 'Invalid argument person (expected a ' + t.getTypeName(Person) + ')';
  });

  return person.name;
}
