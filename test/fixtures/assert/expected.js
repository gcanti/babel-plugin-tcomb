function _assert2(x, type, name) {
  if (t.isType(type)) {
    type(x, [name + ': ' + t.getTypeName(type)]);

    if (type.meta.kind !== 'struct') {
      return;
    }
  }

  if (!(x instanceof type)) {
    t.fail('Invalid value ' + t.stringify(x) + ' supplied to ' + name + ' (expected a ' + t.getTypeName(type) + ')');
  }
}

import t from 'tcomb';

function _assert() {}

function foo(x: string) {
  _assert2(x, t.String, 'x');
}
