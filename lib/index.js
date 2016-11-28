'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RESERVED_NAMES;

exports.default = function (_ref) {
  var t = _ref.types;
  var template = _ref.template;


  var tcombId = null;
  var assertId = null;
  var extendId = null;
  var hasTypes = false;
  var hasAsserts = false;
  var hasExtend = false;
  var recursiveTypes = [];
  var globals = void 0;

  var assertTemplate = expression('\n    function assertId(x, type, name) {\n      if (warnOnFailure) {\n        tcombId.fail = function (message) { console.warn(message); };\n      }\n      if (tcombId.isType(type) && type.meta.kind !== \'struct\') {\n        if (!type.is(x)) {\n          type(x, [name + \': \' + tcombId.getTypeName(type)]);\n        }\n      } else if (!(x instanceof type)) {\n        tcombId.fail(\'Invalid value \' + tcombId.stringify(x) + \' supplied to \' + name + \' (expected a \' + tcombId.getTypeName(type) + \')\');\n      }\n      return x;\n    }\n  ');

  var extendTemplate = expression('\n    function extendId(types, name) {\n      const isAny = (type) => {\n        if (type === tcombId.Any) {\n          return true;\n        }\n        if (tcombId.isType(type) && type.meta.kind === \'maybe\') {\n          return isAny(type.meta.type)\n        }\n        return false;\n      }\n      return tcombId.interface.extend(types.filter(type => !isAny(type)), name)\n    }\n  ');

  var argumentsTemplate = expression('arguments[index] !== undefined ? arguments[index] : defaults');

  //
  // combinators
  //

  function addTypeName(combinatorArguments, typeName, exact) {
    if (t.isStringLiteral(typeName)) {
      if (exact) {
        combinatorArguments.push(t.objectExpression([t.objectProperty(t.identifier('name'), typeName), t.objectProperty(t.identifier('strict'), t.booleanLiteral(true))]));
      } else {
        combinatorArguments.push(typeName);
      }
    } else if (exact) {
      combinatorArguments.push(t.objectExpression([t.objectProperty(t.identifier('strict'), t.booleanLiteral(true))]));
    }
    return combinatorArguments;
  }

  function callCombinator(combinatorId, combinatorArguments, typeName) {
    return t.callExpression(t.memberExpression(tcombId, combinatorId), addTypeName(combinatorArguments, typeName));
  }

  var listId = t.identifier('list');
  var tupleId = t.identifier('tuple');
  var maybeId = t.identifier('maybe');
  var unionId = t.identifier('union');
  var dictId = t.identifier('dict');
  var refinementId = t.identifier('refinement');
  var interfaceId = t.identifier('interface');
  var declareId = t.identifier('declare');
  var intersectionId = t.identifier('intersection');
  var functionId = t.identifier('Function');
  var objectId = t.identifier('Object');
  var nilId = t.identifier('Nil');
  var numberId = t.identifier('Number');
  var stringId = t.identifier('String');
  var booleanId = t.identifier('Boolean');
  var anyId = t.identifier('Any');

  function getListCombinator(type, name) {
    return callCombinator(listId, [type], name);
  }

  function getMaybeCombinator(type, name) {
    return callCombinator(maybeId, [type], name);
  }

  function getTupleCombinator(types, name) {
    return callCombinator(tupleId, [t.arrayExpression(types)], name);
  }

  function getUnionCombinator(types, name) {
    return callCombinator(unionId, [t.arrayExpression(types)], name);
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(t.memberExpression(t.memberExpression(tcombId, t.identifier('enums')), t.identifier('of')), addTypeName([t.arrayExpression(enums.map(function (e) {
      return t.stringLiteral(e);
    }))], name));
  }

  function getDictCombinator(domain, codomain, name) {
    return callCombinator(dictId, [domain, codomain], name);
  }

  function getRefinementCombinator(type, predicate, name) {
    return callCombinator(refinementId, [type, predicate], name);
  }

  function getInterfaceCombinator(props, name, exact) {
    return t.callExpression(t.memberExpression(tcombId, interfaceId), addTypeName([props], name, exact));
  }

  function getDeclareCombinator(name) {
    return callCombinator(declareId, [name]);
  }

  function getIntersectionCombinator(types, name) {
    var intersections = types.filter(function (t) {
      return !t[REFINEMENT_PREDICATE_ID_STORE_FIELD];
    });
    var refinements = types.filter(function (t) {
      return t[REFINEMENT_PREDICATE_ID_STORE_FIELD];
    });
    var intersection = intersections.length > 1 ? t.callExpression(t.memberExpression(tcombId, intersectionId), addTypeName([t.arrayExpression(intersections)], name)) : intersections[0];
    var len = refinements.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        intersection = getRefinementCombinator(intersection, refinements[i][REFINEMENT_PREDICATE_ID_STORE_FIELD], name);
      }
    }
    return intersection;
  }

  //
  // Flow types
  //

  function getTcombType(id) {
    return t.memberExpression(tcombId, id);
  }

  function getFunctionType() {
    return getTcombType(functionId);
  }

  function getObjectType() {
    return getTcombType(objectId);
  }

  function getNumberType() {
    return getTcombType(numberId);
  }

  function getStringType() {
    return getTcombType(stringId);
  }

  function getBooleanType() {
    return getTcombType(booleanId);
  }

  function getVoidType() {
    return getTcombType(nilId);
  }

  function getNullType() {
    return getTcombType(nilId);
  }

  function getAnyType() {
    return getTcombType(anyId);
  }

  function getNumericLiteralType(value) {
    var n = t.identifier('n');
    var predicate = t.functionExpression(null, [n], t.blockStatement([t.returnStatement(t.binaryExpression('===', n, t.numericLiteral(value)))]));
    return getRefinementCombinator(getNumberType(), predicate);
  }

  function getBooleanLiteralType(value) {
    var b = t.identifier('b');
    var type = getBooleanType();
    var predicate = t.functionExpression(null, [b], t.blockStatement([t.returnStatement(t.binaryExpression('===', b, t.booleanLiteral(value)))]));
    return getRefinementCombinator(type, predicate);
  }

  //
  // helpers
  //

  function getExpression(node) {
    return t.isExpressionStatement(node) ? node.expression : node;
  }

  function expression(input) {
    var fn = template(input);
    return function (args) {
      var node = fn(args);
      return getExpression(node);
    };
  }

  function getObjectExpression(properties, typeParameters) {
    var props = properties.map(function (prop) {
      var type = getType(prop.value, typeParameters);
      if (prop.optional) {
        type = getMaybeCombinator(type);
      }
      return t.objectProperty(prop.key, type);
    });
    return t.objectExpression(props);
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (t.isQualifiedTypeIdentifier(id)) {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return id;
  }

  function getRefinementPredicateId(annotation) {
    if (annotation.typeParameters.params.length !== 1 || !annotation.typeParameters.params[0].argument) {
      throw new Error('Invalid refinement definition, example: $Refinement<typeof predicate>');
    }
    return getExpressionFromGenericTypeAnnotation(annotation.typeParameters.params[0].argument.id);
  }

  function isTypeParameter(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name);
  }

  function isGlobalType(name) {
    return globals && globals.hasOwnProperty(name);
  }

  function shouldReturnAnyType(name, typeParameters) {
    // this plugin doesn't handle generics by design
    return isGlobalType(name) || isTypeParameter(name, typeParameters) || flowMagicTypes.hasOwnProperty(name);
  }

  function getGenericTypeAnnotation(annotation, typeParameters, typeName) {
    var name = annotation.id.name;
    if (name === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error('Unsupported Array type annotation: incorrect number of type parameters (expected 1)');
      }
      var typeParameter = annotation.typeParameters.params[0];
      return getListCombinator(getType(typeParameter, typeParameters), typeName);
    }
    if (name === 'Function') {
      return getFunctionType();
    }
    if (name === 'Object') {
      return getObjectType();
    }
    if (name === '$Exact') {
      return getInterfaceCombinator(getObjectExpression(annotation.typeParameters.params[0].properties, typeParameters), typeName, true);
    }
    if (shouldReturnAnyType(name, typeParameters)) {
      return getAnyType();
    }
    var gta = getExpressionFromGenericTypeAnnotation(annotation.id);
    if (name === MAGIC_REFINEMENT_NAME) {
      gta[REFINEMENT_PREDICATE_ID_STORE_FIELD] = getRefinementPredicateId(annotation);
    }
    return gta;
  }

  function getType(annotation, typeParameters, typeName) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation':
        return getGenericTypeAnnotation(annotation, typeParameters, typeName);

      case 'ArrayTypeAnnotation':
        return getListCombinator(getType(annotation.elementType, typeParameters), typeName);

      case 'NullableTypeAnnotation':
        return getMaybeCombinator(getType(annotation.typeAnnotation, typeParameters), typeName);

      case 'TupleTypeAnnotation':
        return getTupleCombinator(annotation.types.map(function (annotation) {
          return getType(annotation, typeParameters);
        }), typeName);

      case 'UnionTypeAnnotation':
        // handle enums
        if (annotation.types.every(function (n) {
          return t.isStringLiteralTypeAnnotation(n);
        })) {
          return getEnumsCombinator(annotation.types.map(function (n) {
            return n.value;
          }), typeName);
        }
        return getUnionCombinator(annotation.types.map(function (annotation) {
          return getType(annotation, typeParameters);
        }), typeName);

      case 'ObjectTypeAnnotation':
        if (annotation.indexers.length === 1) {
          return getDictCombinator(getType(annotation.indexers[0].key, typeParameters), getType(annotation.indexers[0].value, typeParameters), typeName);
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName, annotation.exact);

      case 'IntersectionTypeAnnotation':
        return getIntersectionCombinator(annotation.types.map(function (annotation) {
          return getType(annotation, typeParameters);
        }), typeName);

      case 'FunctionTypeAnnotation':
        return getFunctionType();

      case 'NumberTypeAnnotation':
        return getNumberType();

      case 'StringTypeAnnotation':
        return getStringType();

      case 'BooleanTypeAnnotation':
        return getBooleanType();

      case 'VoidTypeAnnotation':
        return getVoidType();

      case 'NullLiteralTypeAnnotation':
        return getNullType();

      case 'TypeofTypeAnnotation':
      case 'AnyTypeAnnotation':
      case 'MixedTypeAnnotation':
      case 'ExistentialTypeParam':
        return getAnyType();

      case 'StringLiteralTypeAnnotation':
        return getEnumsCombinator([annotation.value], typeName);

      case 'NumericLiteralTypeAnnotation':
        return getNumericLiteralType(annotation.value, typeName);

      case 'BooleanLiteralTypeAnnotation':
        return getBooleanLiteralType(annotation.value, typeName);

      default:
        throw new Error('Unsupported type annotation: ' + annotation.type);
    }
  }

  function nodeToString(id) {
    return (0, _babelGenerator2.default)(id, { concise: true }).code;
  }

  function getAssertCallExpression(id, annotation, typeParameters, name, optional) {
    var type = getType(annotation, typeParameters);
    if (optional) {
      type = getMaybeCombinator(type);
    }
    name = name || t.stringLiteral(nodeToString(id));
    return t.callExpression(assertId, [id, type, name]);
  }

  function getAssert(_ref2, typeParameters) {
    var id = _ref2.id;
    var optional = _ref2.optional;
    var annotation = _ref2.annotation;
    var name = _ref2.name;

    return t.expressionStatement(getAssertCallExpression(id, annotation, typeParameters, name, optional));
  }

  function stripDefaults(node) {
    if (t.isObjectPattern(node)) {
      return t.objectExpression(node.properties.map(function (p) {
        if (t.isRestProperty(p)) {
          return t.spreadProperty(stripDefaults(p.argument));
        }
        return t.objectProperty(p.key, stripDefaults(p.value), false, true);
      }));
    } else if (t.isAssignmentPattern(node)) {
      return stripDefaults(node.left);
    }
    return node;
  }

  function getParamId(isArrow, param, i, defaults) {
    if (t.isObjectPattern(param)) {
      if (isArrow) {
        return stripDefaults(param);
      }
      if (typeof defaults !== 'undefined') {
        return argumentsTemplate({ index: t.identifier(i), defaults: defaults });
      }
      return t.memberExpression(t.identifier('arguments'), t.identifier(i), true);
    }
    if (t.isRestElement(param)) {
      return param.argument;
    }
    return param;
  }

  function getParam(isArrow, param, i, defaults) {
    if (t.isAssignmentPattern(param) && param.left.typeAnnotation) {
      return getParam(isArrow, param.left, i, param.right);
    }
    if (param.typeAnnotation) {
      var id = getParamId(isArrow, param, i, defaults);

      return {
        id: id,
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation,
        name: t.stringLiteral(nodeToString(t.isRestElement(param) ? param.argument : param))
      };
    }
  }

  function getFunctionArgumentCheckExpressions(node, typeParameters) {
    var isArrow = t.isArrowFunctionExpression(node);
    var params = node.params.map(function (param, i) {
      return getParam(isArrow, param, i);
    }).filter(function (x) {
      return x;
    });
    return params.map(function (param) {
      return getAssert(param, typeParameters);
    });
  }

  function getParamName(param) {
    if (t.isAssignmentPattern(param)) {
      return getParamName(param.left);
    } else if (t.isRestElement(param)) {
      return t.restElement(param.argument);
    } else if (t.isObjectPattern(param)) {
      return t.objectPattern(param.properties.map(function (p) {
        return t.objectProperty(p.key, stripDefaults(p.value), false, true);
      }));
    }
    return t.identifier(param.name);
  }

  function stripValueFromProperty(property) {
    return t.objectProperty(property.key, property.key, false, true);
  }

  function getWrappedFunctionReturnWithTypeCheck(node, typeParameters) {
    var params = node.params.map(getParamName);
    var callParams = params.map(function (param) {
      if (t.isObjectPattern(param)) {
        return t.objectExpression(param.properties.map(stripValueFromProperty));
      } else if (t.isRestElement(param)) {
        return t.spreadElement(param.argument);
      }
      return param;
    });

    var id = t.identifier('ret');
    var assertAST = getAssert({
      id: id,
      annotation: node.returnType.typeAnnotation,
      name: t.stringLiteral('return value')
    }, typeParameters);

    var f = t.functionExpression(null, params, node.body);
    f[PROCESSED_FUNCTION_STORE_FIELD] = true;
    return [t.variableDeclaration('const', [t.variableDeclarator(id, t.callExpression(t.memberExpression(f, t.identifier('call')), [t.thisExpression()].concat(callParams)))]), assertAST, t.returnStatement(id)];
  }

  function getTypeParameterName(param) {
    if (t.isGenericTypeAnnotation(param)) {
      return param.id.name;
    }
    return param.name;
  }

  function getTypeParameters(node) {
    var typeParameters = {};
    if (node.typeParameters) {
      node.typeParameters.params.forEach(function (param) {
        return typeParameters[getTypeParameterName(param)] = true;
      });
    }
    return typeParameters;
  }

  function getTypeAliasDefinition(path) {
    var node = path.node;
    var typeParameters = getTypeParameters(node);
    var isRecursive = isRecursiveType(node);
    var annotation = node.right;

    if (isRecursive) {
      recursiveTypes.push(t.callExpression(t.memberExpression(node.id, t.identifier('define')), [getType(annotation, typeParameters)]));
      return defineDeclareCombinator(node);
    }

    var typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(annotation, typeParameters, typeName))]);
  }

  function defineDeclareCombinator(node) {
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getDeclareCombinator(t.stringLiteral(node.id.name)))]);
  }

  function getInterfaceDefinition(node, typeParameters) {
    var isRecursive = isRecursiveType(node);
    var annotation = node.body;

    if (isRecursive) {
      recursiveTypes.push(t.callExpression(t.memberExpression(node.id, t.identifier('define')), [getType(annotation, typeParameters)]));
      return defineDeclareCombinator(node);
    }

    var typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, getType(annotation, typeParameters, typeName))]);
  }

  function getExtendedInterfaceDefinition(node, typeParameters) {
    var isRecursive = isRecursiveType(node);
    var mixins = node.extends.filter(function (m) {
      return m.id.name !== MAGIC_REFINEMENT_NAME;
    });
    typeParameters = mixins.reduce(function (acc, node) {
      return assign(acc, getTypeParameters(node));
    }, typeParameters);
    var refinements = node.extends.filter(function (m) {
      return m.id.name === MAGIC_REFINEMENT_NAME;
    });
    var props = getObjectExpression(node.body.properties, typeParameters);
    var len = refinements.length;
    if (len > 0) {
      props = getInterfaceCombinator(props);
      for (var i = 0; i < len; i++) {
        props = getRefinementCombinator(props, getRefinementPredicateId(refinements[i]));
      }
    }

    if (isRecursive) {
      recursiveTypes.push(t.callExpression(t.memberExpression(node.id, t.identifier('define')), [t.callExpression(extendId, [t.arrayExpression(mixins.map(function (inter) {
        return inter.id;
      }).concat(props))])]));
      return defineDeclareCombinator(node);
    }

    var typeName = t.stringLiteral(node.id.name);
    return t.variableDeclaration('const', [t.variableDeclarator(node.id, t.callExpression(extendId, [t.arrayExpression(mixins.map(function (inter) {
      return inter.id;
    }).concat(props)), typeName]))]);
  }

  function buildCodeFrameError(path, error) {
    throw path.buildCodeFrameError('[' + PLUGIN_NAME + '] ' + error.message);
  }

  function preventReservedNamesUsage(path) {
    var name = path.node.id.name;
    if (name in RESERVED_NAMES) {
      buildCodeFrameError(path, new Error(name + ' is a reserved interface name for ' + PLUGIN_NAME));
    }
  }

  function hasRecursiveComment(node) {
    return Array.isArray(node.leadingComments) && node.leadingComments.some(function (comment) {
      return (/recursive/.test(comment.value)
      );
    });
  }

  function isRecursiveType(node) {
    return node[IS_RECURSIVE_STORE_FIELD] || hasRecursiveComment(node);
  }

  function isExternalImportDeclaration(source) {
    return !(source.indexOf('./') === 0 || source.indexOf('../') === 0);
  }

  function getExternalImportDeclaration(path) {
    var node = path.node;
    var source = node.source.value;
    var typesId = path.scope.generateUidIdentifier(source);
    var importNode = t.importDeclaration([t.importNamespaceSpecifier(typesId)], t.stringLiteral(source));
    return [importNode].concat(node.specifiers.map(function (specifier) {
      var isDefaultImport = specifier.type === 'ImportDefaultSpecifier';
      return t.variableDeclaration('const', [t.variableDeclarator(specifier.local, t.logicalExpression('||', t.memberExpression(typesId, isDefaultImport ? t.identifier('default') : specifier.imported), getAnyType()))]);
    }));
  }

  function isRuntimeTypeIntrospection(node) {
    return node.typeAnnotation && node.typeAnnotation.typeAnnotation && node.typeAnnotation.typeAnnotation.id && node.typeAnnotation.typeAnnotation.id.name === MAGIC_REIFY_NAME;
  }

  function getRuntimeTypeIntrospection(node) {
    return node.typeAnnotation.typeAnnotation.typeParameters.params[0].id;
  }

  function isTypeExportNamedDeclaration(node) {
    return node.declaration && (t.isTypeAlias(node.declaration) || t.isInterfaceDeclaration(node.declaration));
  }

  //
  // visitors
  //

  return {
    visitor: {

      Program: {
        enter: function enter(path, state) {
          hasAsserts = false;
          hasTypes = false;
          hasExtend = false;
          tcombId = path.scope.generateUidIdentifier('t');
          assertId = path.scope.generateUidIdentifier('assert');
          extendId = path.scope.generateUidIdentifier('extend');
          recursiveTypes = [];
          if (!globals && state.opts.globals) {
            globals = state.opts.globals.reduce(function (acc, x) {
              return assign(acc, x);
            }, {});
          }
        },
        exit: function exit(path, state) {
          var isAssertTemplateRequired = hasAsserts && !state.opts[SKIP_HELPERS_OPTION];
          var isExtendTemplateRequired = hasExtend && !state.opts[SKIP_HELPERS_OPTION];
          var isImportTcombRequired = hasTypes || isAssertTemplateRequired || isExtendTemplateRequired;

          if (isImportTcombRequired) {
            path.node.body.unshift(t.importDeclaration([t.importDefaultSpecifier(tcombId)], t.stringLiteral('tcomb')));
          }

          Array.prototype.push.apply(path.node.body, recursiveTypes);

          if (isAssertTemplateRequired) {
            path.node.body.push(assertTemplate({
              warnOnFailure: t.booleanLiteral(!!state.opts[WARN_ON_FAILURE_OPTION]),
              assertId: assertId,
              tcombId: tcombId
            }));
          }

          if (isExtendTemplateRequired) {
            path.node.body.push(extendTemplate({
              extendId: extendId,
              tcombId: tcombId
            }));
          }
        }
      },

      ImportDeclaration: function ImportDeclaration(path) {
        var node = path.node;
        if (node.importKind === 'type') {
          var source = node.source.value;
          if (isExternalImportDeclaration(source)) {
            hasTypes = true;
            path.replaceWithMultiple(getExternalImportDeclaration(path));
          } else {
            // prevent transform-flow-strip-types
            node.importKind = 'value';
          }
        }
      },
      ExportNamedDeclaration: function ExportNamedDeclaration(path) {
        var node = path.node;
        // prevent transform-flow-strip-types
        if (isTypeExportNamedDeclaration(node)) {
          node.exportKind = 'value';
          node.declaration[IS_RECURSIVE_STORE_FIELD] = isRecursiveType(node);
        }
      },
      TypeAlias: function TypeAlias(path) {
        preventReservedNamesUsage(path);
        hasTypes = true;
        path.replaceWith(getTypeAliasDefinition(path));
      },
      InterfaceDeclaration: function InterfaceDeclaration(path) {
        preventReservedNamesUsage(path);
        hasTypes = true;
        var node = path.node;
        var typeParameters = getTypeParameters(node);
        if (path.node.extends.length > 0) {
          hasExtend = true;
          path.replaceWith(getExtendedInterfaceDefinition(node, typeParameters));
        } else {
          path.replaceWith(getInterfaceDefinition(node, typeParameters));
        }
      },
      TypeCastExpression: function TypeCastExpression(path, state) {
        var node = path.node;
        if (isRuntimeTypeIntrospection(node)) {
          try {
            path.replaceWith(getRuntimeTypeIntrospection(node));
          } catch (error) {
            buildCodeFrameError(path, new Error('Invalid use of ' + MAGIC_REIFY_NAME + ', example: const ReifiedMyType = (({}: any): $Reify<MyType>)'));
          }
        } else {
          if (state.opts[SKIP_ASSERTS_OPTION]) {
            return;
          }
          hasAsserts = true;
          var typeParameters = assign(getTypeParameters(node), node[TYPE_PARAMETERS_STORE_FIELD]);
          path.replaceWith(getAssert({
            id: node.expression,
            annotation: node.typeAnnotation.typeAnnotation
          }, typeParameters));
        }
      },
      Class: function Class(path) {
        // store type parameters so we can read them later
        var node = path.node;
        var typeParameters = getTypeParameters(node);
        path.traverse({
          Function: function Function(_ref3) {
            var node = _ref3.node;

            node[TYPE_PARAMETERS_STORE_FIELD] = assign(typeParameters, node[TYPE_PARAMETERS_STORE_FIELD]);
          }
        });
      },
      VariableDeclaration: function VariableDeclaration(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return;
        }

        var node = path.node;

        if (node.kind !== 'const') {
          return;
        }

        for (var i = 0, len = node.declarations.length; i < len; i++) {
          var declarator = node.declarations[i];
          var id = declarator.id;

          if (!id.typeAnnotation) {
            return;
          }

          hasAsserts = true;
          declarator.init = getAssertCallExpression(declarator.init, id.typeAnnotation.typeAnnotation, node[TYPE_PARAMETERS_STORE_FIELD], t.stringLiteral(nodeToString(id)));
        }
      },
      Function: function Function(path, state) {
        var node = path.node;
        if (state.opts[SKIP_ASSERTS_OPTION] || node[PROCESSED_FUNCTION_STORE_FIELD]) {
          return;
        }
        node[PROCESSED_FUNCTION_STORE_FIELD] = true;

        var isAsync = false;
        var typeParameters = assign(getTypeParameters(node), node[TYPE_PARAMETERS_STORE_FIELD]);

        // store type parameters so we can read them later
        path.traverse({
          'Function|VariableDeclaration|TypeCastExpression': function FunctionVariableDeclarationTypeCastExpression(_ref4) {
            var node = _ref4.node;

            node[TYPE_PARAMETERS_STORE_FIELD] = assign(typeParameters, node[TYPE_PARAMETERS_STORE_FIELD]);
          },
          AwaitExpression: function AwaitExpression() {
            isAsync = true;
          }
        });

        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (t.isArrowFunctionExpression(node) && node.expression) {
            node.expression = false;
            node.body = t.blockStatement([t.returnStatement(node.body)]);
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType && !isAsync) {
            hasAsserts = true;
            path.get('body').replaceWithMultiple(getWrappedFunctionReturnWithTypeCheck(node, typeParameters));
          }

          // Prepend any argument checks to the top of our function body.
          var argumentChecks = getFunctionArgumentCheckExpressions(node, typeParameters);
          if (argumentChecks.length > 0) {
            var _node$body$body;

            hasAsserts = true;
            (_node$body$body = node.body.body).unshift.apply(_node$body$body, _toConsumableArray(argumentChecks));
          }
        } catch (error) {
          buildCodeFrameError(path, error);
        }
      }
    }
  };
};

var _babelGenerator = require('babel-generator');

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*! @preserve
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * babel-plugin-tcomb - Babel plugin for static and runtime type checking using Flow and tcomb
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * The MIT License (MIT)
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Copyright (c) 2016 Giulio Canti
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   */

var PLUGIN_NAME = 'babel-plugin-tcomb';
var TYPE_PARAMETERS_STORE_FIELD = '__babel_plugin_tcomb_typeParametersStoreField';
var IS_RECURSIVE_STORE_FIELD = '__babel_plugin_tcomb_isRecursiveStoreField';
var REFINEMENT_PREDICATE_ID_STORE_FIELD = '__babel_plugin_tcomb_refinementPredicateIdStoreField';
var PROCESSED_FUNCTION_STORE_FIELD = '__babel_plugin_tcomb_ProcessedFunctionField';

var flowMagicTypes = {
  '$Shape': true,
  '$Keys': true,
  '$Diff': true,
  '$Abstract': true,
  '$Subtype': true,
  '$ObjMap': true
};

// plugin magic types
var MAGIC_REFINEMENT_NAME = '$Refinement';
var MAGIC_REIFY_NAME = '$Reify';
var RESERVED_NAMES = (_RESERVED_NAMES = {}, _defineProperty(_RESERVED_NAMES, MAGIC_REFINEMENT_NAME, true), _defineProperty(_RESERVED_NAMES, MAGIC_REIFY_NAME, true), _RESERVED_NAMES);

// plugin config

// useful for tests
var SKIP_HELPERS_OPTION = 'skipHelpers';
// useful for keeping the models
var SKIP_ASSERTS_OPTION = 'skipAsserts';
var WARN_ON_FAILURE_OPTION = 'warnOnFailure';

function assign(x, y) {
  if (y) {
    for (var k in y) {
      x[k] = y[k];
    }
  }
  return x;
}