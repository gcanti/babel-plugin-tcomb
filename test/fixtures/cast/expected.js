import _t from 'tcomb';

const User = _t.interface({
  name: _t.String
}, 'User');

export function getUser(userId) {
  _assert(userId, _t.String, 'userId');

  const ret = function (userId) {
    return axios.get('').then(p => {
      return _assert(p.data, typeof User !== "undefined" ? User : _t.Any, 'p.data');
    });
  }.call(this, userId);

  _assert(ret, typeof Promise !== "undefined" ? Promise : _t.Any, 'return value');

  return ret;
}
