'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1
};

exports['default'] = function (_ref) {
  var Plugin = _ref.Plugin;
  var t = _ref.types;

  var tcombLocalName = 't';

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return t.identifier(id.name);
  }

  function getList(node) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('list')), [getType(node)]);
  }

  function getMaybe(node) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('maybe')), [getType(node)]);
  }

  function getTuple(nodes) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('tuple')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getUnion(nodes) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('union')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getDict(key, value) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('dict')), [getType(key), getType(value)]);
  }

  function getIntersection(nodes) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('intersection')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getFunc(domain, codomain) {
    return t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('func')), [t.arrayExpression(domain.map(getType)), getType(codomain)]);
  }

  function getType(annotation) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation':
        if (annotation.id.name === 'Array') {
          if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
            throw new SyntaxError('Unsupported Array type annotation');
          }
          return getList(annotation.typeParameters.params[0]);
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id);

      case 'ArrayTypeAnnotation':
        return getList(annotation.elementType);

      case 'NullableTypeAnnotation':
        return getMaybe(annotation.typeAnnotation);

      case 'TupleTypeAnnotation':
        return getTuple(annotation.types);

      case 'UnionTypeAnnotation':
        return getUnion(annotation.types);

      case 'ObjectTypeAnnotation':
        if (annotation.indexers.length === 1) {
          return getDict(annotation.indexers[0].key, annotation.indexers[0].value);
        }
        throw new SyntaxError('[babel-plugin-tcomb] Unsupported Object type annotation');

      case 'IntersectionTypeAnnotation':
        return getIntersection(annotation.types);

      case 'FunctionTypeAnnotation':
        return getFunc(annotation.params.map(function (param) {
          return param.typeAnnotation;
        }), annotation.returnType);

      default:
        throw new SyntaxError('[babel-plugin-tcomb] Unsupported type annotation: ' + annotation.type);
    }
  }

  function getAssert(typeAnnotation, id) {
    var is = t.callExpression(t.memberExpression(getType(typeAnnotation), t.identifier('is')), [id]);
    var assert = t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('assert')), [is]);
    return t.expressionStatement(assert);
  }

  function getFunctionArgumentChecks(node) {

    function getTypeAnnotation(param) {
      if (param.type === 'AssignmentPattern') {
        if (param.left.typeAnnotation) {
          throw new SyntaxError('[babel-plugin-tcomb] Typed default values are not supported');
        }
      }
      return param.typeAnnotation;
    }

    return node.params.filter(getTypeAnnotation).map(function (param) {
      var id = t.identifier(param.name);
      var typeAnnotation = getTypeAnnotation(param);
      return getAssert(typeAnnotation.typeAnnotation, id);
    });
  }

  function getFunctionReturnTypeCheck(node) {
    var params = node.params.map(function (param) {
      return t.identifier(param.name);
    });
    var id = t.identifier('ret');

    var isArrowExpression = node.type === 'ArrowFunctionExpression' && node.expression;
    var body = isArrowExpression ? t.blockStatement([t.returnStatement(node.body)]) : node.body;

    return [t.variableDeclaration('const', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionDeclaration(null, params, body), t.identifier('call')), [t.identifier('this')].concat(params)))]), getAssert(node.returnType.typeAnnotation, id), t.returnStatement(id)];
  }

  function getTcombLocalNameFromImports(node) {
    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      if (node.specifiers[i].type === 'ImportDefaultSpecifier') {
        return node.specifiers[i].local.name;
      }
    }
  }

  return new Plugin('tcomb', {
    visitor: {

      ImportDeclaration: {
        exit: function exit(node) {
          if (tcombLibraries.hasOwnProperty(node.source.value)) {
            tcombLocalName = getTcombLocalNameFromImports(node);
          }
        }
      },

      Function: {
        exit: function exit(node) {
          try {

            var body = getFunctionArgumentChecks(node);
            if (node.returnType) {
              body.push.apply(body, _toConsumableArray(getFunctionReturnTypeCheck(node)));
            } else {
              if (node.type === 'ArrowFunctionExpression' && node.expression) {
                body.push(t.returnStatement(node.body));
              } else {
                body.push.apply(body, _toConsumableArray(node.body.body));
              }
            }

            var ret = undefined;
            if (node.type === 'FunctionDeclaration') {
              ret = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
            } else if (node.type === 'FunctionExpression') {
              ret = t.functionExpression(node.id, node.params, t.blockStatement(body));
            } else if (node.type === 'ArrowFunctionExpression') {
              ret = t.arrowFunctionExpression(node.params, t.blockStatement(body), false);
            } else {
              throw new SyntaxError('Unsupported function type');
            }

            ret.returnType = node.returnType;

            return ret;
          } catch (e) {
            if (e instanceof SyntaxError) {
              throw this.errorWithNode('[babel-plugin-tcomb] ' + e.message);
            } else {
              throw e;
            }
          }
        }
      }
    }
  });
};

module.exports = exports['default'];