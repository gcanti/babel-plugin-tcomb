import t from "tcomb";

class A {
  constructor(x) {
    _assert(x, t.Any, "x");

    this.x = x;
  }
}