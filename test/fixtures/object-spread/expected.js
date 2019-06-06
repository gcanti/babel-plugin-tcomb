import _t from "tcomb";

const A = _t.interface({
  a: _t.String
}, "A");

const B = _spread([{
  "props": {
    b: _t.String
  }
}, {
  "interface": A,
  "maybe": false
}, {
  "props": {
    c: _t.String
  }
}], "B");

const C = _spread([{
  "props": {
    d: _t.Any
  }
}, {
  "interface": B,
  "maybe": true
}, {
  "props": {
    f: _t.String
  }
}], "C");

function _spread(items, name) {
  return _t.interface(items.reduce((props, item) => {
    if (item.props) {
      return _t.mixin(props, item.props, true);
    }

    const interfaceProps = item.interface.meta.props;

    if (item.maybe) {
      Object.keys(interfaceProps).forEach(key => {
        interfaceProps[key] = _t.maybe(interfaceProps[key]);
      });
    }

    return _t.mixin(props, interfaceProps, true);
  }, {}), name);
}
