import t from "tcomb";

class A {
  constructor(x) {
    _assert(x, typeof T !== "undefined" ? T : t.Any, "x");

    this.x = x;
  }
}