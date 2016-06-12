import _t from "tcomb";
// recursive

const Path = _t.declare("Path");

Path.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path)
}))

// recursive

const Path = _t.declare("Path");

Path.define(_t.interface({
  node: Node,
  parentPath: _t.maybe(Path)
}))

// recursive

const Path = _t.declare("Path");

Path.define(_t.interface.extend([A, {
  node: Node,
  parentPath: _t.maybe(Path)
}]))
