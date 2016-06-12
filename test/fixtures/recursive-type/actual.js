// recursive
type Path = {
  node: Node,
  parentPath: ?Path
};

// recursive
interface Path {
  node: Node,
  parentPath: ?Path
}

// recursive
interface Path extends A {
  node: Node,
  parentPath: ?Path
}
