function _assert2(x, type, name) {
  if (!type) {
    type = t.Any;
  }

  if (t.isType(type) && type.meta.kind !== 'struct') {
    var y = type.meta.kind === 'interface' && typeof x === 'function' ? t.mixin({}, x) : x;
    type(y, [name + ': ' + t.getTypeName(type)]);
  } else if (!(x instanceof type)) {
    t.fail('Invalid value ' + t.stringify(x) + ' supplied to ' + name + ' (expected a ' + t.getTypeName(type) + ')');
  }

  return x;
}

import t from 'tcomb';

function _assert() {}

function foo(x: string) {
  _assert2(x, t.String, 'x');
}
