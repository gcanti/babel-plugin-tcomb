var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const f = ({ a }) => {
  _assert({
    a
  }, T, "{ a }");
};

const g = ({ a, ...b }) => {
  _assert(_extends({
    a
  }, b), T, "{ a, ...b }");
};
