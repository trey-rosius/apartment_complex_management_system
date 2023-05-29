## Building Stack

The building stack follows the same process of creation like the user stack.

Here’s the building endpoint we will be creating.

```tsx
createBuilding(input: BuildingInput!): Building!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])
```

A building can only be created by 

- A logged in User
- The User has to belong to the `Admins` group.

Inside the `lib` folder, create a file named `building-lambda-stack.ts`.

We will be needed the `CfnGraphQLApi` , the `CfnGraphQLSchema` and `Table` same as `user` stack.

At the top of the `building-lambda-stack.ts` file, create an interface which extends `StackProps` and define the 3 resources we intend importing from the main stack.

```tsx
interface BuildingLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
}
```

Then the Building stack looks like this 

```tsx
export class BuildingLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: BuildingLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema } = props;
}
}
```

Let’s go ahead and define our lambda, resolver and datasource.

Create a folder called `building` inside `lib/lambda-fns`.Inside the `building` folder, create a folder called entities, which would contain the building entity. 

Create a filed named `app.ts` that’ll serve as the lambda handler for building endpoints.

Open up the `building-lambda-stacks.ts` file and define the rest of the resources like so.

### Lambda

```tsx
const buildingLambda = new NodejsFunction(this, "AcmsBuildingHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "lambda-fns/building", "app.ts"),

      memorySize: 1024,
    });
```

### Lambda Datasource

```tsx
const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "ACMSBuildingLambdaDatasource",
      {
        apiId: acmsGraphqlApi.attrApiId,
        name: "ACMSBuildingLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: buildingLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );
```

### Resolver

```tsx
const createBuildingResolver: CfnResolver = new CfnResolver(
      this,
      "createBuildingResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createBuilding",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
```

Grab the complete code for `building-lambda-stack.ts` here. [https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/building-lambda-stack.ts](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/building-lambda-stack.ts)

Next step is to implement endpoint routing logic in the buildings lambda handler `app.ts.`

Firstly, here’s the input schema for the `createBuilding` endpoint.

```graphql
input BuildingInput {
  name: String!
  userId: String!
  numberOfApartments: Int!
  address: AddressInput!
}
```

Here’s how the `app.ts` file looks like

```tsx
const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type BuildingInput = {
  name: string;
  userId: string;
  numberOfApartments: number;
  address: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
};

exports.handler = async (
  event: AppSyncResolverEvent<BuildingInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createBuilding":
      return await createBuilding(event.arguments, logger);

    default:
      return null;
  }
};
```

Create a file called `createBuilding.ts` inside `lib\lambda-fns\building\` .

This file would contain code for the  `createBuilding` function, that performs a put request on the DynamoDB table, based on the input.

```tsx
async function createBuilding(buildingInput: BuildingInput, logger: Logger) {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const input: BuildingEntity = new BuildingEntity({
    id: id,
    ...buildingInput,
    createdOn,
  });

  logger.info(`create building input info", ${buildingInput}`);
  const params = {
    TableName: tableName,
    Item: input.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return input.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating a building ${error}`);
    throw Error(`an error occured ${error}`);
  }
}
```

Don’t forget to add the building stack to your app like so

```tsx
const app = new cdk.App();
const acmsStack = new AcmsStack(app, "AcmsStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});

new BuildingLamdaStacks(app, "BuildingLambdaStacks", {
  env: { account: "13xxxxxxxxxx5", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});
```