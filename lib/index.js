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

function getAnnotationId(id) {
  if (id.type === 'QualifiedTypeIdentifier') {
    return getAnnotationId(id.qualification) + '.' + id.id.name;
  }
  return id.name;
}

exports['default'] = function (_ref) {
  var Plugin = _ref.Plugin;
  var t = _ref.types;

  var tcombNamespace = 't';

  function getType(annotation) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation':
        // handle t.list() combinator ( `Array<Type>` syntax )
        if (annotation.id.name === 'Array') {
          return tcombNamespace + '.list(' + getType(annotation.typeParameters.params[0]) + ')';
        }
        return getAnnotationId(annotation.id);

      case 'ArrayTypeAnnotation':
        // handle t.list() combinator ( `Type[]` syntax )
        return tcombNamespace + '.list(' + getType(annotation.elementType) + ')';

      case 'NullableTypeAnnotation':
        // handle t.maybe() combinator ( `?Type` syntax )
        return tcombNamespace + '.maybe(' + getType(annotation.typeAnnotation) + ')';

      case 'TupleTypeAnnotation':
        // handle t.tuple() combinator ( `[Type1, Type2]` syntax )
        return tcombNamespace + '.tuple([' + annotation.types.map(getType).join(', ') + '])';

      case 'UnionTypeAnnotation':
        // handle t.union() combinator ( `Type1 | Type2` syntax )
        return tcombNamespace + '.union([' + annotation.types.map(getType).join(', ') + '])';

      case 'ObjectTypeAnnotation':
        // handle t.dict() combinator ( `{[key: Type]: Type2}` syntax )
        return tcombNamespace + '.dict(' + getType(annotation.indexers[0].key) + ', ' + getType(annotation.indexers[0].value) + ')';

      case 'IntersectionTypeAnnotation':
        // handle t.intersection() combinator ( `Type 1 & Type2` syntax )
        return tcombNamespace + '.intersection([' + annotation.types.map(getType).join(', ') + '])';

      default:
        throw new SyntaxError('Unsupported type annotation: ' + annotation.type);
    }
  }

  function getFunctionArgumentChecks(node) {
    return node.params.filter(function (param) {
      return param.typeAnnotation;
    }).map(function (param, i) {
      var id = t.identifier(param.name);
      return t.expressionStatement(t.assignmentExpression('=', id, t.callExpression(t.identifier(getType(param.typeAnnotation.typeAnnotation)), [id])));
    });
  }

  function getFunctionReturnTypeCheck(node) {
    var params = node.params.map(function (param) {
      return t.identifier(param.name);
    });
    var id = t.identifier('ret');

    var body = node.type === 'ArrowFunctionExpression' && node.expression ? t.blockStatement([t.returnStatement(node.body)]) : node.body;

    return [t.variableDeclaration('const', [t.variableDeclarator(id, t.callExpression(t.functionDeclaration(null, params, body), params))]), t.returnStatement(t.callExpression(t.identifier(getType(node.returnType.typeAnnotation)), [id]))];
  }

  return new Plugin('tcomb', {
    visitor: {

      ImportDeclaration: {
        exit: function exit(node) {
          // scan the imports looking for a tcomb import ( `import t from 'tcomb'` syntax )
          if (tcombLibraries.hasOwnProperty(node.source.value)) {
            for (var i = 0, len = node.specifiers.length; i < len; i++) {
              if (node.specifiers[i].type === 'ImportDefaultSpecifier') {
                tcombNamespace = node.specifiers[i].local.name;
              }
            }
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
            }

            ret.returnType = node.returnType;

            return ret;
          } catch (e) {
            if (e instanceof SyntaxError) {
              throw this.errorWithNode(e.message);
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