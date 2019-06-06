import _t from "tcomb";

const User = _t.interface({
  name: _t.String
}, "User");

export function getUser(userId) {
  _assert(userId, _t.String, "userId");

  const ret = function (userId) {
    return axios.get('').then(p => {
      return _assert(p.data, User, "p.data");
    });
  }.call(this, userId);

  _assert(ret, Promise, "return value");

  return ret;
}

const a = _assert('a string', A, "'a string'");

const b = _assert({}, B, "{}");

function coerce(a) {
  _assert(a, _t.Any, "a");

  const ret = function (a) {
    return _assert(_assert(a, _t.Any, "a"), _t.Any, "(a: any)");
  }.call(this, a);

  _assert(ret, _t.Any, "return value");

  return ret;
}
