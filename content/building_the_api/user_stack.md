## User Stack

In this stack, we’ll define all resources related to the user entity.

We have 3 user related endpoints defined in the `schema.graphql` file.

But we will implement  `createUserAccount` endpoint only.

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools
deleteUserAccount(id: ID!): Boolean! @aws_cognito_user_pools
```

Create a file called `user-lambda-stack.ts` in the `lib` folder. 

Remember that, when we created the main stack above, we made a couple of resources public, meaning they could be shared and used within stacks.

`

```
  public readonly acmsDatabase: Table;
  public readonly acmsGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly acmsTableDatasource: CfnDataSource;
```

In the User stack, we will be needed the `CfnGraphQLApi` , the `CfnGraphQLSchema` and `Table`

At the top of the `user-lambda-stack.ts` file, create an interface which extends `StackProps` and define the 3 resources we intend importing from the main stack.

```jsx
interface UserLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
}
```

Then, in the constructor for class `UserLambdaStacks`, change `StackProps` to `UserLambdaStackProps`.

So now, here’s how the `user-lambda-stack` looks like 

```jsx
interface UserLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
}
export class UserLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema } = props;

}
}
```

Notice that we’ve also de-structured the `props` to get all the resources defined in the interface.

We are going to be using a lambda resolver to resolve all endpoints for this user entity.

Let’s go ahead and get started