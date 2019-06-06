import _t from "tcomb";

const Node = _t.interface({}, "Node"); // recursive


const Path1 = _t.declare("Path1"); // recursive


export const Path2 = _t.declare("Path2"); // recursive

const Path3 = _t.declare("Path3"); // recursive


export const Path4 = _t.declare("Path4"); // recursive

const Path5 = _t.declare("Path5"); // recursive


export const Path6 = _t.declare("Path6");
Path1.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path1)
}))
Path2.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path2)
}))
Path3.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path3)
}))
Path4.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path4)
}))
Path5.define(_extend([A, {
  node: Node,
  parentPath: _t.maybe(Path5)
}]))
Path6.define(_extend([A, {
  node: Node,
  parentPath: _t.maybe(Path6)
}]))
