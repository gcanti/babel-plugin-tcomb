import t from 'tcomb';
class A {
  foo(x: t.String): t.String {
    return x;
  }
}

class B {
  bar() {
    [].forEach((n): void => {
      console.log(this);
    });
  }
}
