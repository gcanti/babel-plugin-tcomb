var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const f = ({ a }) => {
  _assert({
    a
  }, T, "{ a }");
};

const g = (_ref) => {
  let { a } = _ref;

  let b = _objectWithoutProperties(_ref, ["a"]);

  _assert(_extends({
    a
  }, b), T, "{ a, ...b }");
};
