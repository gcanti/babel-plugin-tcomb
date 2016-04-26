'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
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
        throw new SyntaxError('Unsupported Object type annotation');

      case 'IntersectionTypeAnnotation':
        return getIntersection(annotation.types);

      case 'FunctionTypeAnnotation':
        return getFunc(annotation.params.map(function (param) {
          return param.typeAnnotation;
        }), annotation.returnType);

      default:
        throw new SyntaxError('Unsupported type annotation: ' + annotation.type);
    }
  }

  function getAssert(typeAnnotation, id) {
    var is = t.callExpression(t.memberExpression(getType(typeAnnotation), t.identifier('is')), [id]);
    var assert = t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('assert')), [is]);
    return t.expressionStatement(assert);
  }

  function getFunctionArgumentCheckExpressions(node) {

    function getTypeAnnotation(param) {
      if (param.typeAnnotation) {
        if (param.type === 'AssignmentPattern') {
          return { name: param.left.name, typeAnnotation: param.typeAnnotation };
        }
        return { name: param.name, typeAnnotation: param.typeAnnotation };
      }
    }

    return node.params.filter(getTypeAnnotation).map(function (param) {
      var _getTypeAnnotation = getTypeAnnotation(param);

      var name = _getTypeAnnotation.name;
      var typeAnnotation = _getTypeAnnotation.typeAnnotation;

      var id = t.identifier(name);
      return getAssert(typeAnnotation.typeAnnotation, id);
    });
  }

  function getWrappedFunctionReturnWithTypeCheck(node) {
    var params = node.params.map(function (param) {
      return t.identifier(param.name);
    });
    var id = t.identifier('ret');

    return [t.variableDeclaration('var', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')), [t.identifier('this')].concat(params)))]), getAssert(node.returnType.typeAnnotation, id), t.returnStatement(id)];
  }

  function getTcombLocalNameFromImports(node) {
    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      if (node.specifiers[i].type === 'ImportDefaultSpecifier') {
        return node.specifiers[i].local.name;
      }
    }
  }

  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(_ref2) {
        var node = _ref2.node;

        if (tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombLocalName = getTcombLocalNameFromImports(node);
        }
      },
      Function: function Function(path) {
        var node = path.node;


        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (node.type === "ArrowFunctionExpression" && node.expression) {
            node.expression = false;
            node.body = t.blockStatement([t.returnStatement(node.body)]);
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType) {
            var funcBody = path.get('body');

            funcBody.replaceWithMultiple(getWrappedFunctionReturnWithTypeCheck(node));
          }

          // Prepend any argument checks to the top of our function body.
          var argumentChecks = getFunctionArgumentCheckExpressions(node);
          if (argumentChecks.length > 0) {
            var _node$body$body;

            (_node$body$body = node.body.body).unshift.apply(_node$body$body, _toConsumableArray(argumentChecks));
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error('[babel-plugin-tcomb] ' + e.message);
          } else {
            throw e;
          }
        }
      }
    }
  };
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1
};