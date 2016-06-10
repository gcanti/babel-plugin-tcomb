import t from "tcomb";

const User = t.interface({
  name: t.String
}, "User");


export function getUser(userId) {
  _assert(userId, t.String, "userId");

  const ret = function (userId) {
    return axios.get('').then(p => {
      return _assert(p.data, typeof User !== "undefined" ? User : t.Any, "p.data");
    });
  }.call(this, userId);

  _assert(ret, typeof Promise !== "undefined" ? Promise : t.Any, "return value");

  return ret;
}