class A {
  constructor(x: t.String) {
    t.assert(t.String.is(x));

    this.x = x;
  }

}