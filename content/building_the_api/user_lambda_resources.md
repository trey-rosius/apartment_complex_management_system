## Lambda Resolver

Inside the `lib` folder, create another folder called `lambda-fns`. 

This folder would contain code for all our lambda functions and entities.
Let’s create files and folders specific to the user endpoints and entities.

Inside the `lambda-fns` folder, create another folder called `user`.

Create 3 typescript files inside the `user` folder.

- main.ts
- userEntity.ts
- createUserAccounts.ts

`main.ts` would serve as our ,lambda handler, routing all user endpoints to their respective destinations.

Inside the user stack, defined your lambda resource as follows

```tsx
const codeSigningConfig = new lambda.CodeSigningConfig(
      this,
      "CodeSigningConfig",
      {
        signingProfiles: [signingProfile],
      }
    );
    const acmsLambda = new NodejsFunction(this, "AcmsUserHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "lambda-fns/user", "main.ts"),

      memorySize: 1024,
    });

```

The first endpoint we are going to implement is the `createUserAccount` endpoint, which takes input 

```graphql
input UserInput {
  firstName: String!
  lastName: String!
  email: String!
  verified: Boolean!
  userType: UserType!
}
```

Also define the lambda datasource and resolver resources as follows inside the user stack.

```tsx
const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "ACMSLambdaDatasource",
      {
        apiId: acmsGraphqlApi.attrApiId,
        name: "ACMSLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: acmsLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      "createUserAccountResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createUserAccount",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
```

Grant permissions and add `dependsOn`.

```tsx
    createUserAccountResolver.addDependsOn(apiSchema);
    acmsDatabase.grantFullAccess(acmsLambda);
    acmsLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
```

Grab the complete code here [https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/user-lambda-stack.ts](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/user-lambda-stack.ts)

Inside the `main.ts` file, type in the following code

```tsx
import { Logger } from "@aws-lambda-powertools/logger";
import createUserAccount from "./createUserAccounts";
import { AppSyncResolverEvent, Context } from "aws-lambda";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
  userType: string;
};

exports.handler = async (
  event: AppSyncResolverEvent<UserInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createUserAccount":
      return await createUserAccount(event.arguments, logger);

    default:
      return null;
  }
};
```

Inside the `createUserAccount` file, type in the following code. This file takes 2 arguments.

- UserInput
- Logger

```tsx
import { Logger } from "@aws-lambda-powertools/logger";
import UserEntity from "./userEntity";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
  userType: string;
};
type UserReturnParameters = {
  id: string;
  ENTITY: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  updatedOn: string;
  createdOn: string;
};

async function createUserAccount(
  input: UserInput,
  logger: Logger
): Promise<UserReturnParameters> {
  const documentClient = new DynamoDB.DocumentClient();
//DynamoDB table name
  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

//User Entity
  const userInput: UserEntity = new UserEntity({
    id: id,
    ...input,
    createdOn,
  });

  logger.info(`create user input info", ${userInput}`);
  const params = {
    TableName: tableName,
    Item: userInput.toItem(),
    ConditionExpression: "attribute_not_exists(PK)",
  };

  try {
    await documentClient.put(params).promise();
    return userInput.graphQlReturn();
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException")
      logger.error(`an error occured while creating user ${error}`);
    throw Error("A user with same email address already Exist");
  }
}
export default createUserAccount;
```

Firstly, we defined structures for the `UserInput` and `UserReturnParameters`. Then we instantiate DynamoDb Document client, populate a `UserEntity` class and carryout a DynamoDB `put` transaction. 

Also, we want to make sure that a user with that particular email doesn’t already exist in the database. So we use `attribute_not_exists(PK)`.

Here’s how the `userEntity` class looks like 

```tsx
interface UserParameters {
  id: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  createdOn: string;
  updatedOn?: string;
}
class UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  createdOn: string;
  updatedOn: string;

  constructor({
    id,
    firstName,
    lastName,
    verified,
    email,
    userType,
    createdOn,
    updatedOn,
  }: UserParameters) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.verified = verified;
    this.email = email;
    this.userType = userType;
    this.updatedOn = updatedOn ?? "";

    this.createdOn = createdOn;
  }

  key(): {
    PK: string;
    SK: string;
  } {
    return {
      PK: `USER#${this.email}`,
      SK: `USER#${this.email}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      id: this.id,
      ENTITY: "USER",
      firstName: this.firstName,
      lastName: this.lastName,
      verified: this.verified,
      email: this.email,
      userType: this.userType,
      updatedOn: this.updatedOn,
      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      ENTITY: "USER",
      firstName: this.firstName,
      lastName: this.lastName,
      verified: this.verified,
      email: this.email,
      userType: this.userType,
      updatedOn: this.updatedOn,
      createdOn: this.createdOn,
    };
  }
}

export default UserEntity;
```

The last step is to add the user stack to the app. 

Navigate to the `bin` folder and open up the app file. Mine is `acms.ts`.

Modify the file contents to look like this now.

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
```

### Deploy

You can grab the complete code for the `acms` and `userStacks` and deploy using 

```tsx
cdk bootstrap
cdk deploy --all
```