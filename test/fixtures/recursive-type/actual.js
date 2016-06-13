// recursive
type Path1 = {
  node: Node,
  parentPath: ?Path1
};

// recursive
export type Path2 = {
  node: Node,
  parentPath: ?Path2
};

// recursive
interface Path3 {
  node: Node,
  parentPath: ?Path3
}

// recursive
export interface Path4 {
  node: Node,
  parentPath: ?Path4
}

// recursive
interface Path5 extends A {
  node: Node,
  parentPath: ?Path5
}

// recursive
export interface Path6 extends A {
  node: Node,
  parentPath: ?Path6
}
