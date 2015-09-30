'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function getAnnotationId(id) {
  if (id.type === 'QualifiedTypeIdentifier') {
    return getAnnotationId(id.qualification) + '.' + id.id.name;
  }
  return id.name;
}

function hasTypeAnnotation(x) {
  return !!x.typeAnnotation;
}

var tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1
};

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
      default:
        throw new SyntaxError('Unsupported type annotation type: ' + annotation.type);
    }
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
            var _ret = (function () {
              var ret = t.identifier('ret');
              var params = node.params.map(function (param) {
                return t.identifier(param.name);
              });
              // type check the arguments
              var body = node.params.map(function (param, i) {
                if (hasTypeAnnotation(param)) {
                  return t.expressionStatement(t.assignmentExpression('=', params[i], t.callExpression(t.identifier(getType(param.typeAnnotation.typeAnnotation)), [params[i]])));
                }
              });
              if (node.returnType) {
                // call original function and store the return value in the ret variable
                body.push(t.variableDeclaration('const', [t.variableDeclarator(ret, t.callExpression(t.functionDeclaration(null, params, node.body), params))]));
                // type check the return value
                body.push(t.returnStatement(t.callExpression(t.identifier(getType(node.returnType.typeAnnotation)), [ret])));
              } else {
                body.push.apply(body, _toConsumableArray(node.body.body));
              }
              var f = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
              f.returnType = node.returnType;
              return {
                v: f
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
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