import t from "tcomb";

interface A {
  a: string;
}

interface B extends A {
  b: string;
}

interface C extends A {}

interface D extends A, $Refinement<typeof p> {}
