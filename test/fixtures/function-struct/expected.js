const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  person = Person(person);

  return person.name;
}