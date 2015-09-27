'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var NAME = '_t';

function getQualifiedTypeIdentifier(id) {
  if (id.type === 'QualifiedTypeIdentifier') {
    return getQualifiedTypeIdentifier(id.qualification) + '.' + id.id.name;
  }
  return id.name;
}

function hasTypeAnnotation(x) {
  return x.typeAnnotation;
}

exports['default'] = function (_ref) {
  var Plugin = _ref.Plugin;
  var t = _ref.types;

  function getType(annotation) {
    var typeAnnotation = annotation.typeAnnotation;
    switch (typeAnnotation.type) {
      case 'GenericTypeAnnotation':
        return t.identifier(getQualifiedTypeIdentifier(typeAnnotation.id));
    }
    return 'Unknown';
  }

  return new Plugin('tcomb', {
    visitor: {

      Function: {
        exit: function exit(node, parent) {
          var ret = t.identifier('ret');
          var params = node.params.map(function (param) {
            return t.identifier(param.name);
          });
          // type check the arguments
          var body = node.params.map(function (param, i) {
            if (hasTypeAnnotation(param)) {
              return t.expressionStatement(t.assignmentExpression('=', params[i], t.callExpression(getType(param.typeAnnotation), [params[i]])));
            }
          });
          if (node.returnType) {
            // call original function and store the return value in the ret variable
            body.push(t.variableDeclaration('const', [t.variableDeclarator(ret, t.callExpression(t.functionDeclaration(null, params, node.body), params))]));
            // type check the return value
            body.push(t.returnStatement(t.callExpression(getType(node.returnType), [ret])));
          } else {
            body.push.apply(body, _toConsumableArray(node.body.body));
          }
          var f = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
          f.returnType = node.returnType;
          return f;
        }
      }
    }
  });
};

module.exports = exports['default'];