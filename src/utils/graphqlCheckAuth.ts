

type gqlArgs = { root: any, args: any, context: any }

export function GraphqlCheckAuth(resolve: (...gqlArgs: any[]) => any, ...gqlArgs: gqlArgs[]) {
    const [root, args, context] = gqlArgs;
    console.log('Check Auth')
    return resolve(root, args, context);
}