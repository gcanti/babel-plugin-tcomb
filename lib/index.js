'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;


  var tcombLocalName = null;

  function ensureTcombLocalName() {
    if (!tcombLocalName) {
      tcombLocalName = t.identifier('require("tcomb")');
    }
  }

  function getTcombLocalNameFromImports(node) {
    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      var specifier = node.specifiers[i];
      var found = specifier.type === 'ImportSpecifier' && specifier.imported.name === 't' || specifier.type === 'ImportDefaultSpecifier';
      if (found) {
        return t.identifier(specifier.local.name);
      }
    }
  }

  function getTcombLocalNameFromRequires(node) {
    var importName = node.init.arguments[0].value;

    if (importName === 'tcomb' && node.id.type === 'Identifier') {
      return t.identifier(node.id.name);
    } else if (node.id.type === 'Identifier') {
      return t.identifier(node.id.name + '.t');
    } else if (node.id.type == 'ObjectPattern') {
      for (var i = 0, len = node.id.properties.length; i < len; i++) {
        var property = node.id.properties[i];
        if (property.key.name === 't') {
          return t.identifier(property.key.name);
        }
      }
    }
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return t.identifier(id.name);
  }

  function getList(node) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('list')), [getType(node)]);
  }

  function getMaybe(node) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('maybe')), [getType(node)]);
  }

  function getTuple(nodes) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('tuple')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getUnion(nodes) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('union')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getDict(key, value) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('dict')), [getType(key), getType(value)]);
  }

  function getIntersection(nodes) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('intersection')), [t.arrayExpression(nodes.map(getType))]);
  }

  function getFunc(domain, codomain) {
    return t.callExpression(t.memberExpression(tcombLocalName, t.identifier('func')), [t.arrayExpression(domain.map(getType)), getType(codomain)]);
  }

  function getNumber() {
    return t.memberExpression(tcombLocalName, t.identifier('Number'));
  }

  function getString() {
    return t.memberExpression(tcombLocalName, t.identifier('String'));
  }

  function getBoolean() {
    return t.memberExpression(tcombLocalName, t.identifier('Boolean'));
  }

  function getVoid() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'));
  }

  function getNull() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'));
  }

  function getAny() {
    return t.memberExpression(tcombLocalName, t.identifier('Any'));
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

      case 'NumberTypeAnnotation':
        return getNumber();

      case 'StringTypeAnnotation':
        return getString();

      case 'BooleanTypeAnnotation':
        return getBoolean();

      case 'VoidTypeAnnotation':
        return getVoid();

      case 'NullLiteralTypeAnnotation':
        return getNull();

      case 'AnyTypeAnnotation':
      case 'MixedTypeAnnotation':
        return getAny();

      default:
        throw new SyntaxError('Unsupported type annotation: ' + annotation.type);
    }
  }

  function getAssertForType(_ref2) {
    var id = _ref2.id;
    var type = _ref2.type;

    // const guard = t.callExpression(
    //   t.memberExpression(type, t.identifier('is')),
    //   [id]
    // );
    var guard = t.callExpression(t.memberExpression(tcombLocalName, t.identifier('is')), [id, type]);
    var message = t.binaryExpression('+', t.binaryExpression('+', t.stringLiteral('Invalid argument ' + id.name + ' (expected a '), t.callExpression(t.memberExpression(tcombLocalName, t.identifier('getTypeName')), [type])), t.stringLiteral(')'));
    var assert = t.callExpression(t.memberExpression(tcombLocalName, t.identifier('assert')), [guard, message]);
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
      type: t.memberExpression(tcombLocalName, t.identifier('Object'))
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
      ensureTcombLocalName();
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

  function getWrappedFunctionReturnWithTypeCheck(node) {
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

    return [t.variableDeclaration('var', [t.variableDeclarator(id, t.callExpression(t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')), [t.identifier('this')].concat(params)))])].concat(_toConsumableArray(asserts), [t.returnStatement(id)]);
  }

  return {
    visitor: {
      Program: {
        enter: function enter() {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombLocalName = null;
        }
      },

      ImportDeclaration: function ImportDeclaration(_ref6) {
        var node = _ref6.node;

        if (!tcombLocalName && tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombLocalName = getTcombLocalNameFromImports(node);
        }
      },
      VariableDeclarator: function VariableDeclarator(_ref7) {
        var node = _ref7.node;

        if (node.init && node.init.type && node.init.type === 'CallExpression' && node.init.callee.name === 'require' && node.init.arguments && node.init.arguments.length > 0 && node.init.arguments[0].type === 'StringLiteral' && tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
          tcombLocalName = getTcombLocalNameFromRequires(node);
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
            ensureTcombLocalName();

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