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

  var tcombLocalName = null;

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

  function getAssertForType(_ref2) {
    var id = _ref2.id;
    var type = _ref2.type;

    var guard = t.callExpression(t.memberExpression(type, t.identifier('is')), [id]);
    var message = t.binaryExpression('+', t.binaryExpression('+', t.literal('Invalid argument ' + id.name + ' (expected a '), t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('getTypeName')), [type])), t.literal(')'));
    var assert = t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('assert')), [guard, message]);
    return t.expressionStatement(assert);
  }

  function isObjectStructureAnnotation(typeAnnotation) {
    // Example: function foo(x : { bar: t.String })
    return typeAnnotation.type === 'ObjectTypeAnnotation' && typeAnnotation.indexers.length !== 1;
  }

  function getAssertsForObjectTypeAnnotation(_ref3) {
    var name = _ref3.name;
    var typeAnnotation = _ref3.typeAnnotation;

    var asserts = [];

    // Firstly assert that the param is in fact an Object.
    asserts.push(getAssertForType({
      id: t.identifier(name),
      type: t.memberExpression(t.identifier(tcombLocalName), t.identifier('Object'))
    }));

    // Now generate asserts for each of it the prop/type pairs within the
    // ObjectTypeAnnotation.
    typeAnnotation.properties.forEach(function (prop) {
      var qualifiedName = name + '.' + prop.key.name;
      if (isObjectStructureAnnotation(prop.value)) {
        getAssertsForObjectTypeAnnotation({ name: qualifiedName, typeAnnotation: prop.value }).forEach(function (x) {
          return asserts.push(x);
        });
      } else {
        getAssertsForTypeAnnotation({ name: qualifiedName, typeAnnotation: prop.value }).forEach(function (x) {
          return asserts.push(x);
        });
      }
    });

    return asserts;
  }

  function getAssertsForTypeAnnotation(_ref4) {
    var name = _ref4.name;
    var typeAnnotation = _ref4.typeAnnotation;

    if (isObjectStructureAnnotation(typeAnnotation)) {
      return getAssertsForObjectTypeAnnotation({
        name: name,
        typeAnnotation: typeAnnotation
      });
    }

    var type = getType(typeAnnotation);
    return [getAssertForType({ id: t.identifier(name), type: type })];
  }

  function getFunctionArgumentCheckExpressions(node) {
    var typeAnnotatedParams = node.params.reduce(function (acc, param) {
      if (param.type === 'AssignmentPattern') {
        if (param.left.typeAnnotation) {
          acc.push({
            name: param.left.name,
            typeAnnotation: param.left.typeAnnotation.typeAnnotation
          });
        } else if (param.typeAnnotation) {
          acc.push({
            name: param.left.name,
            typeAnnotation: param.typeAnnotation.typeAnnotation
          });
        }
      } else if (param.typeAnnotation) {
        acc.push({
          name: param.name,
          typeAnnotation: param.typeAnnotation.typeAnnotation
        });
      }

      return acc;
    }, []);

    if (typeAnnotatedParams.length > 0) {
      guardTcombImport();
    }

    return typeAnnotatedParams.reduce(function (acc, _ref5) {
      var name = _ref5.name;
      var typeAnnotation = _ref5.typeAnnotation;

      getAssertsForTypeAnnotation({ name: name, typeAnnotation: typeAnnotation }).forEach(function (x) {
        return acc.push(x);
      });
      return acc;
    }, []);
  }

  function getObjectPatternParamIdentifiers(properties) {
    return properties.reduce(function (acc, property) {
      if (property.value.type === 'ObjectPattern') {
        getObjectPatternParamIdentifiers(property.value.properties).forEach(function (x) {
          return acc.push(x);
        });
      } else {
        acc.push(t.identifier(property.value.name));
      }
      return acc;
    }, []);
  }

  function getFunctionReturnTypeCheck(node) {
    var params = node.params.reduce(function (acc, param) {
      if (param.type === 'ObjectPattern') {
        getObjectPatternParamIdentifiers(param.properties).forEach(function (x) {
          return acc.push(x);
        });
      } else if (param.type === 'AssignmentPattern') {
        acc.push(t.identifier(param.left.name));
      } else {
        acc.push(t.identifier(param.name));
      }
      return acc;
    }, []);

    var name = 'ret';
    var id = t.identifier(name);

    var asserts = getAssertsForTypeAnnotation({
      name: name,
      typeAnnotation: node.returnType.typeAnnotation
    });

    var isArrowExpression = node.type === 'ArrowFunctionExpression' && node.expression;
    var body = isArrowExpression ? t.blockStatement([t.returnStatement(node.body)]) : node.body;

    return [t.variableDeclaration('var', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionExpression(null, params, body), t.identifier('call')), [t.identifier('this')].concat(params)))])].concat(_toConsumableArray(asserts), [t.returnStatement(id)]);
  }

  function getTcombLocalNameFromImports(node) {
    var result = undefined;

    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      var specifier = node.specifiers[i];
      if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 't') {
        result = specifier.local.name;
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        result = specifier.local.name;
      }
    }

    return result;
  }

  function getTcombLocalNameFromRequires(node) {
    var result = undefined;

    var importName = node.init.arguments[0].value;

    if (importName === 'tcomb' && node.id.type === 'Identifier') {
      result = node.id.name;
    } else if (node.id.type === 'Identifier') {
      result = node.id.name + '.t';
    } else if (node.id.type == 'ObjectPattern') {
      node.id.properties.forEach(function (property) {
        if (property.key.name === 't') {
          result = property.key.name;
        }
      });
    }

    return result;
  }

  function guardTcombImport() {
    if (!tcombLocalName) {
      throw new Error('When setting type annotations on a function, an import of tcomb must be available within the scope of the function.');
    }
  }

  return new Plugin('tcomb', {
    visitor: {

      Program: {
        enter: function enter() {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombLocalName = null;
        }
      },

      ImportDeclaration: {
        exit: function exit(node) {
          if (!tcombLocalName && tcombLibraries.hasOwnProperty(node.source.value)) {
            tcombLocalName = getTcombLocalNameFromImports(node);
          }
        }
      },

      VariableDeclarator: {
        exit: function exit(node) {
          if (node.init && node.init.type && node.init.type === 'CallExpression' && node.init.callee.name === 'require' && node.init.arguments && node.init.arguments.length > 0 && node.init.arguments[0].type === 'Literal' && tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
            tcombLocalName = getTcombLocalNameFromRequires(node);
          }
        }
      },

      Function: {
        exit: function exit(node) {
          try {

            var body = getFunctionArgumentCheckExpressions(node);
            if (node.returnType) {
              guardTcombImport();
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