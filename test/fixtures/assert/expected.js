import t from 'tcomb';

function _assert() {}

function foo(x) {
  _assert2(x, t.String, 'x');
}

function _assert2(x, type, name) {
  type = type || t.Any;

  if (t.isType(type) && type.meta.kind !== 'struct') {
    type(x, [name + ': ' + t.getTypeName(type)]);
  } else if (!(x instanceof type)) {
    t.fail('Invalid value ' + t.stringify(x) + ' supplied to ' + name + ' (expected a ' + t.getTypeName(type) + ')');
  }

  return x;
}
