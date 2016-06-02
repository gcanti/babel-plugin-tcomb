const tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1,
  'redux-tcomb': 1
};

export default function ({ types: t }) {

  let tcombLocalName = null;

  function ensureTcombLocalName() {
    if (!tcombLocalName) {
      tcombLocalName = t.callExpression(
        t.identifier('require'),
        [t.StringLiteral('tcomb')]
      );
    }
  }

  function getTcombLocalNameFromImports(node) {
    for (let i = 0, len = node.specifiers.length ; i < len ; i++) {
      const specifier = node.specifiers[i];
      const found = ( specifier.type === 'ImportSpecifier' && specifier.imported.name === 't' ) || specifier.type === 'ImportDefaultSpecifier'
      if (found) {
        return t.identifier(specifier.local.name);
      }
    }
  }

  function getTcombLocalNameFromRequires(node) {
    const importName = node.init.arguments[0].value;

    if (importName === 'tcomb' && node.id.type === 'Identifier') {
      return t.identifier(node.id.name);
    }
    if (node.id.type === 'Identifier') {
      return t.identifier(node.id.name + '.t');
    }
    if (node.id.type == 'ObjectPattern') {
      for (let i = 0, len = node.id.properties.length; i < len; i++) {
        const property = node.id.properties[i];
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

  function addName(args, name) {
    if (typeof name === 'object') {
      args.push(name);
    }
    return args;
  }

  function getList(node, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('list')),
      addName([getType(node)], name)
    );
  }

  function getMaybe(type, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('maybe')),
      addName([type], name)
    );
  }

  function getTuple(nodes, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('tuple')),
      addName([t.arrayExpression(nodes.map(getType))], name)
    );
  }

  function getUnion(nodes, name) {
    // handle enums
    if (nodes.every(n => n.type === 'StringLiteralTypeAnnotation')) {
      return getEnums(nodes.map(n => n.value), name);
    }
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('union')),
      addName([t.arrayExpression(nodes.map(getType))], name)
    );
  }

  function getEnums(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombLocalName, t.identifier('enums')), t.identifier('of')),
      addName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    );
  }

  function getDict(key, value, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('dict')),
      addName([getType(key), getType(value)], name)
    );
  }

  function getIntersection(nodes, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('intersection')),
      addName([t.arrayExpression(nodes.map(getType))], name)
    );
  }

  function getFunc(domain, codomain, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('func')),
      addName([t.arrayExpression(domain.map(getType)), getType(codomain)], name)
    );
  }

  function getInterface(annotation, name) {
    const props = annotation.properties
      .map(prop => {
        const name = t.identifier(prop.key.name);
        let type = getType(prop.value);
        if (prop.optional) {
          type = getMaybe(type)
        }
        return t.objectProperty(name, type);
      });
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('inter')),
      addName([t.objectExpression(props)], name)
    );
  }

  //
  // Flow types
  //

  function getNumber() {
    return t.memberExpression(tcombLocalName, t.identifier('Number'))
  }

  function getString() {
    return t.memberExpression(tcombLocalName, t.identifier('String'))
  }

  function getBoolean() {
    return t.memberExpression(tcombLocalName, t.identifier('Boolean'))
  }

  function getVoid() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'))
  }

  function getNull() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'))
  }

  function getAny() {
    return t.memberExpression(tcombLocalName, t.identifier('Any'))
  }

  function getType(annotation, name) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        if (annotation.id.name === 'Array') {
          if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
            // TODO(giu) what's this?
            throw new SyntaxError(`Unsupported Array type annotation`);
          }
          return getList(annotation.typeParameters.params[0], name);
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id);

      case 'ArrayTypeAnnotation' :
        return getList(annotation.elementType, name);

      case 'NullableTypeAnnotation' :
        return getMaybe(getType(annotation.typeAnnotation), name);

      case 'TupleTypeAnnotation' :
        return getTuple(annotation.types, name);

      case 'UnionTypeAnnotation' :
        return getUnion(annotation.types, name);

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDict(annotation.indexers[0].key, annotation.indexers[0].value, name);
        }
        return getInterface(annotation, name);

      case 'IntersectionTypeAnnotation' :
        return getIntersection(annotation.types, name);

      case 'FunctionTypeAnnotation' :
        return getFunc(annotation.params.map((param) => param.typeAnnotation), annotation.returnType, name);

      case 'NumberTypeAnnotation' :
        return getNumber();

      case 'StringTypeAnnotation' :
        return getString();

      case 'BooleanTypeAnnotation' :
        return getBoolean();

      case 'VoidTypeAnnotation' :
        return getVoid();

      case 'NullLiteralTypeAnnotation' :
        return getNull();

      case 'AnyTypeAnnotation' :
      case 'MixedTypeAnnotation' :
        return getAny();

      case 'StringLiteralTypeAnnotation' :
        return getEnums([annotation.value], name)

      default :
        throw new SyntaxError(`Unsupported type annotation: ${annotation.type}`);
    }
  }

  function getAssertForRequiredType({ id, type }) {
    const guard = t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('is')),
      [id, type]
    );
    const message = t.binaryExpression(
      '+',
      t.binaryExpression(
        '+',
        t.stringLiteral('Invalid argument ' + id.name + ' (expected a '),
        t.callExpression(t.memberExpression(tcombLocalName, t.identifier('getTypeName')), [type])
      ),
      t.stringLiteral(')')
    );
    const assert = t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('assert')),
      [guard, message]
    );
    return t.expressionStatement(assert);
  }

  function isObjectStructureAnnotation(typeAnnotation) {
    // Example: function foo(x : { bar: t.String })
    return typeAnnotation.type === 'ObjectTypeAnnotation' && typeAnnotation.indexers.length !== 1;
  }

  function getAssert({ name, optional, typeAnnotation }) {
    let type = getType(typeAnnotation);
    if (optional) {
      type = getMaybe(type);
    }
    return getAssertForRequiredType({ id: t.identifier(name), type });
  }

  function getFunctionArgumentCheckExpressions(node) {
    const params = [];

    node.params.forEach((param, i) => {
      if (param.type === 'AssignmentPattern') {
        if (param.left.typeAnnotation) {
          params.push({
            name: param.left.name,
            optional: param.optional,
            typeAnnotation: param.left.typeAnnotation.typeAnnotation
          });
        }
        else if (param.typeAnnotation) {
          params.push({
            name: param.left.name,
            optional: param.optional,
            typeAnnotation: param.typeAnnotation.typeAnnotation
          });
        }
      }
      else if (param.typeAnnotation) {
        params.push({
          name: param.type === 'ObjectPattern' ? 'arguments[' + i + ']' : param.name,
          optional: param.optional,
          typeAnnotation: param.typeAnnotation.typeAnnotation
        });
      }
    });

    if (params.length > 0) {
      ensureTcombLocalName();
    }

    return params.map(getAssert)
  }

  function getWrappedFunctionReturnWithTypeCheck(node) {
    const params = node.params.map(param => {
      if (param.type === 'ObjectPattern') {
        return param;
      }
      else if (param.type === 'AssignmentPattern') {
        return param.left;
      }
      return t.identifier(param.name);
    })
    const callParams = params.map(param => {
      if (param.type === 'ObjectPattern') {
        return t.objectExpression(param.properties);
      }
      return param;
    })

    const name = 'ret';
    const id = t.identifier(name);

    const assert = getAssert({
      name,
      typeAnnotation: node.returnType.typeAnnotation
    });

    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')),
            [t.identifier('this')].concat(callParams)
          )
        )
      ]),
      assert,
      t.returnStatement(id)
    ];
  }

  return {
    visitor: {
      Program: {
        enter() {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombLocalName = null;
        }
      },

      ImportDeclaration(path) {
        const { node } = path;
        if (!tcombLocalName && tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombLocalName = getTcombLocalNameFromImports(node);
        }
        if (node.importKind === 'type') {
          path.replaceWith(
            t.importDeclaration(node.specifiers, node.source)
          );
        }
      },

      VariableDeclarator({ node }) {
        if (node.init && node.init.type &&
            node.init.type === 'CallExpression' &&
            node.init.callee.name === 'require' &&
            node.init.arguments &&
            node.init.arguments.length > 0 &&
            node.init.arguments[0].type === 'StringLiteral' &&
            tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
          tcombLocalName = getTcombLocalNameFromRequires(node);
        }
      },

      TypeAlias(path) {
        const { node } = path;
        ensureTcombLocalName();
        path.replaceWith(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              node.id,
              getType(node.right, t.stringLiteral(node.id.name))
            )
          ])
        );
      },

      Function(path) {
        const { node } = path;

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

            const funcBody = path.get('body');

            funcBody.replaceWithMultiple(
              getWrappedFunctionReturnWithTypeCheck(node)
            );
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressions(node);
          if (argumentChecks.length > 0) {
            node.body.body.unshift(...argumentChecks);
          }
        }
        catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error('[babel-plugin-tcomb] ' + e.message);
          }
          else {
            throw e;
          }
        }
      }
    }
  };
}
