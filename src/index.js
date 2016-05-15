const tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1
};

export default function ({ Plugin, types: t }) {

  let tcombLocalName = null;

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return t.identifier(id.name);
  }

  function getList(node) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('list')),
      [getType(node)]
    );
  }

  function getMaybe(node) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('maybe')),
      [getType(node)]
    );
  }

  function getTuple(nodes) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('tuple')),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getUnion(nodes) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('union')),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getDict(key, value) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('dict')),
      [getType(key), getType(value)]
    );
  }

  function getIntersection(nodes) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('intersection')),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getFunc(domain, codomain) {
    return t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('func')),
      [t.arrayExpression(domain.map(getType)), getType(codomain)]
    );
  }

  function getType(annotation) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        if (annotation.id.name === 'Array') {
          if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
            throw new SyntaxError(`Unsupported Array type annotation`);
          }
          return getList(annotation.typeParameters.params[0]);
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id);

      case 'ArrayTypeAnnotation' :
        return getList(annotation.elementType);

      case 'NullableTypeAnnotation' :
        return getMaybe(annotation.typeAnnotation);

      case 'TupleTypeAnnotation' :
        return getTuple(annotation.types);

      case 'UnionTypeAnnotation' :
        return getUnion(annotation.types);

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDict(annotation.indexers[0].key, annotation.indexers[0].value);
        }
        throw new SyntaxError(`Unsupported Object type annotation`);

      case 'IntersectionTypeAnnotation' :
        return getIntersection(annotation.types);

      case 'FunctionTypeAnnotation' :
        return getFunc(annotation.params.map((param) => param.typeAnnotation), annotation.returnType);

      default :
        throw new SyntaxError(`Unsupported type annotation: ${annotation.type}`);
    }
  }

  function getAssertForType({ id, type }) {
    const guard = t.callExpression(
      t.memberExpression(type, t.identifier('is')),
      [id]
    );
    const message = t.binaryExpression(
      '+',
      t.binaryExpression(
        '+',
        t.literal('Invalid argument ' + id.name + ' (expected a '),
        t.callExpression(t.memberExpression(t.identifier(tcombLocalName), t.identifier('getTypeName')), [type])
      ),
      t.literal(')')
    );
    const assert = t.callExpression(
      t.memberExpression(t.identifier(tcombLocalName), t.identifier('assert')),
      [guard, message]
    );
    return t.expressionStatement(assert);
  }

  function isObjectStructureAnnotation(typeAnnotation) {
    // Example: function foo(x : { bar: t.String })
    return typeAnnotation.type === 'ObjectTypeAnnotation' && typeAnnotation.indexers.length !== 1
  }

  function getAssertsForObjectTypeAnnotation({ name, typeAnnotation }) {
    const asserts = [];

    // Firstly assert that the param is in fact an Object.
    asserts.push(getAssertForType({
      id: t.identifier(name),
      type: t.memberExpression(t.identifier(tcombLocalName), t.identifier('Object'))
    }));

    // Now generate asserts for each of it the prop/type pairs within the
    // ObjectTypeAnnotation.
    typeAnnotation.properties
      .forEach(prop => {
        const qualifiedName = name + '.' + prop.key.name;
        if (isObjectStructureAnnotation(prop.value)) {
          getAssertsForObjectTypeAnnotation({ name: qualifiedName, typeAnnotation: prop.value })
            .forEach(x => asserts.push(x));
        } else {
          getAssertsForTypeAnnotation({ name: qualifiedName, typeAnnotation: prop.value })
            .forEach(x => asserts.push(x));
        }
      });

    return asserts;
  }

  function getAssertsForTypeAnnotation({ name, typeAnnotation }) {
    if (isObjectStructureAnnotation(typeAnnotation)) {
      return getAssertsForObjectTypeAnnotation({
        name,
        typeAnnotation
      });
    }

    const type = getType(typeAnnotation);
    return [getAssertForType({ id: t.identifier(name), type })];
  }

  function getFunctionArgumentCheckExpressions(node) {
    const typeAnnotatedParams = node.params.reduce((acc, param) => {
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

    return typeAnnotatedParams.reduce((acc, { name, typeAnnotation } ) => {
      getAssertsForTypeAnnotation({ name, typeAnnotation }).forEach(x => acc.push(x));
      return acc;
    }, []);
  }

  function getObjectPatternParamIdentifiers(properties) {
    return properties.reduce((acc, property) => {
      if (property.value.type === 'ObjectPattern') {
        getObjectPatternParamIdentifiers(property.value.properties)
          .forEach(x => acc.push(x))
      } else {
        acc.push(t.identifier(property.value.name));
      }
      return acc;
    }, []);
  }

  function getFunctionReturnTypeCheck(node) {
    const params = node.params.reduce((acc, param) => {
      if (param.type === 'ObjectPattern') {
        getObjectPatternParamIdentifiers(param.properties)
          .forEach(x => acc.push(x));
      } else if (param.type === 'AssignmentPattern') {
        acc.push(t.identifier(param.left.name));
      } else {
        acc.push(t.identifier(param.name));
      }
      return acc;
    }, []);

    const name = 'ret';
    const id = t.identifier(name);

    const asserts = getAssertsForTypeAnnotation({
      name,
      typeAnnotation: node.returnType.typeAnnotation
    });

    const isArrowExpression = ( node.type === 'ArrowFunctionExpression' && node.expression );
    const body = isArrowExpression ?
      t.blockStatement([t.returnStatement(node.body)]) :
      node.body;

    return [
      t.variableDeclaration('var', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.memberExpression(t.functionExpression(null, params, body), t.identifier('call')),
            [t.identifier('this')].concat(params)
          )
        )
      ]),
      ...asserts,
      t.returnStatement(id)
    ];
  }

  function getTcombLocalNameFromImports(node) {
    let result;

    for (let i = 0, len = node.specifiers.length ; i < len ; i++) {
      const specifier = node.specifiers[i];
      if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 't') {
        result = specifier.local.name;
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        result = specifier.local.name;
      }
    }

    return result;
  }

  function getTcombLocalNameFromRequires(node) {
    let result;

    const importName = node.init.arguments[0].value;

    if (importName === 'tcomb' && node.id.type === 'Identifier') {
      result = node.id.name;
    } else if (node.id.type === 'Identifier') {
      result = node.id.name + '.t';
    } else if (node.id.type == 'ObjectPattern') {
      node.id.properties.forEach(property => {
        if (property.key.name === 't') {
          result = property.key.name;
        }
      });
    }

    return result;
  }

  function guardTcombImport() {
    if (!tcombLocalName) {
      throw new Error(
        'When setting type annotations on a function, an import of tcomb must be available within the scope of the function.');
    }
  }

  return new Plugin('tcomb', {
    visitor: {

      Program: {
        enter() {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombLocalName = null;
        }
      },

      ImportDeclaration: {
        exit(node) {
          if (!tcombLocalName && tcombLibraries.hasOwnProperty(node.source.value)) {
            tcombLocalName = getTcombLocalNameFromImports(node);
          }
        }
      },

      VariableDeclarator: {
        exit(node) {
          if (node.init && node.init.type &&
              node.init.type === 'CallExpression' &&
              node.init.callee.name === 'require' &&
              node.init.arguments &&
              node.init.arguments.length > 0 &&
              node.init.arguments[0].type === 'Literal' &&
              tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
            tcombLocalName = getTcombLocalNameFromRequires(node);
          }
        }
      },

      Function: {
        exit(node) {
          try {

            const body = getFunctionArgumentCheckExpressions(node);
            if (node.returnType) {
              guardTcombImport();
              body.push(...getFunctionReturnTypeCheck(node));
            }
            else {
              if (node.type === 'ArrowFunctionExpression' && node.expression) {
                body.push(t.returnStatement(node.body));
              }
              else {
                body.push(...node.body.body);
              }
            }

            let ret;
            if (node.type === 'FunctionDeclaration') {
              ret = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
            }
            else if (node.type === 'FunctionExpression') {
              ret = t.functionExpression(node.id, node.params, t.blockStatement(body));
            }
            else if (node.type === 'ArrowFunctionExpression') {
              ret = t.arrowFunctionExpression(node.params, t.blockStatement(body), false);
            }
            else {
              throw new SyntaxError('Unsupported function type');
            }

            ret.returnType = node.returnType;

            return ret;
          }
          catch (e) {
            if (e instanceof SyntaxError) {
              throw this.errorWithNode('[babel-plugin-tcomb] ' + e.message);
            }
            else {
              throw e;
            }
          }
        }
      }
    }
  });
}
