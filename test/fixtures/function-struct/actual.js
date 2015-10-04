const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  return person.name;
}