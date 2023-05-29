

# Access Patterns

Administrator

- Create/update/delete Administrator accounts.

```jsx
PK:USER#EMAIL
SK:USER#EMAIL
```

- Create/Update/Read/List/Delete Buildings

```jsx
PK:BUILDING
SK:BUILDING#BUILDINGID
```

- Create/Update/Delete Apartments

```jsx
PK:BUILDING#BUILDINGID
SK:APARTMENT#APARTMENTID
```

- list all buildings

```jsx
starts_with(BUILDING#)
PK:BUILDING
SK: BUILDING#
```

- list apartments per building

```jsx
starts_with(APARTMENT#)
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- list all bookings per apartment

```jsx
begins_with(BOOKINGS#)
PK:APARTMENTS#APARTMENTID
SK:BOOKINGS#
```

Tenants

- Create/update/read/delete account

```jsx
PK:USER#EMAIL
SK:USER#EMAIL

```

- List all Buildings in their Area

```jsx
filter with `longitude` and `latitude`
PK:BUILDING
SK:BUILDING#BUILDINGID
```

- List available apartments for each building

```jsx
conditional expression `where status==available`
PK:BUILDING#BUILDINGID
SK:APARTMENT#
```

- Book an apartment

```jsx

BOOKING_STATUS = PENDING

PK:USER#USERNAME
SK:APARTMENT#APARTMENTID
GSI
GSI1PK:BUILDING#BUILDINGID
GSI1SK:APARTMENT#APARTMENTID#STATUS
```

### Single Table DynamoDB Design

[Untitled](https://www.notion.so/377a16a240d14001beae7166cf49334a)

## NOSQL WORKBENCH

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png)

### Get All Apartments Per Building

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png)

### Get All Bookings Per Apartment

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png)

alt text

### Get All Buildings Per User

![https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png)

alt text


## GET STARTED

### Initialize CDK app

Firstly, create a new project directory. I’m using a mac, so i’ll create mine and cd into it

`mkdir acms`

`cd acms`

Create a CDK typescript application in your newly created directory

`cdk init --language typescript`

Once created, open up the newly created CDK app in your favorite IDE.

### Dependencies

Please open up your `package.json` file and add these dependencies to it. 

```jsx
"@aws-lambda-powertools/logger": "^0.9.1",
"@aws-lambda-powertools/tracer": "^0.9.1",
"@types/aws-lambda": "^8.10.101",
"aws-sdk": "^2.1153.0",
"ksuid": "^2.0.0",
```

We’ll be using the brand new `lambda-powertools` typescript library for logging and tracing. 

Feel free to read more about the library here [https://awslabs.github.io/aws-lambda-powertools-typescript/latest/](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)

`ksuid` stands for K-Sortable Unique Identifier. Its an efficient, comprehensive, battle-tested Go library for generating and parsing a specific kind of globally unique identifier called a *KSUID.*

Learn more about the library here [https://github.com/segmentio/ksuid](https://github.com/segmentio/ksuid)

### Stacks

We are going to have 6 stacks in total.

- The main application Stack(Defines the Appsync API, Database, Datasource etc for the complete app)
- A User Stack (For User Resources)
- A Building Stack (For Building Resources)
- An Apartment Stack (For Apartment Resources)
- A Bookings Stack (For Booking Resources)
- DynamoDb Stream Stack

To provision infrastructure resources, all constructs that represent AWS resources must be defined, directly or indirectly, within the scope of a Stack construct.

An App is a container for one or more stacks: it serves as each stack’s scope. Stacks within a single App can easily refer to each others’ resources (and attributes of those resources).

The AWS CDK infers dependencies between stacks so that they can be deployed in the correct order. You can deploy any or all of the stacks defined within an app with a single cdk deploy command.

Our app is defined in the `bin` folder, while our stacks are in the `lib` folder.

Add your `account` and `region` to the `env` object in the cdk app file located in the `bin` folder.

Here’s how mine looks like

```
const app = new cdk.App();const acmsStack = new AcmsStack(app, "AcmsStack", {  env: { account: "13xxxxxxxxxx", region: "us-east-2" },});
```

`AcmsStack` file is located the `lib` folder.

### ACMS Stack

In this stack construct, we are going to provision the following infrastructure resources

- Cognito UserPool
- AppSync GraphQL Api
- DynamoDb Table
- CloudWatch and DynamoDB role managed Policies.

Inside `acms-stack.ts` file located in `lib` folder, we’ll defined constructs for the above resources. And because we’ll be using the resources in other stacks, we have to expose the resources somehow. We’ll see that in a bit.

### Cognito UserPool

Let’s define the userpool and the userpool client

```jsx
/**
 * UserPool and UserPool Client
 */
const userPool: UserPool = new cognito.UserPool(this, "ACMSCognitoUserPool", {
  selfSignUpEnabled: true,
  accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
  userVerification: {
    emailStyle: cognito.VerificationEmailStyle.CODE,
  },
  autoVerify: {
    email: true,
  },
  standardAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});

const userPoolClient: UserPoolClient = new cognito.UserPoolClient(
  this,
  "ACMSUserPoolClient",
  {
    userPool,
  }
);
```

### GraphQL API and Schema.

In the root directory of your project, create a folder called `schema`. Inside this folder, create a file called `schema.graphql`.

Type this into the `schema.graphql` file.

```graphql
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Mutation {
  createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
  updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools
  deleteUserAccount(id: ID!): Boolean! @aws_cognito_user_pools

  createBuilding(input: BuildingInput!): Building!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])

  createApartment(input: ApartmentInput): Apartment!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])

  createApartmentBooking(input: CreateBookingInput!): Booking!
    @aws_cognito_user_pools(cognito_groups: ["Tenants"])
}

type Subscription {
  onCreateApartmentBooking: Booking
    @aws_cognito_user_pools
    @aws_subscribe(mutations: ["createApartmentBooking"])
}

type Query {
  getUserAccount(id: ID!): User! @aws_cognito_user_pools
  getBookings(bookingId: String): Booking

  getAllUserAccounts(pagination: Pagination): UsersResult!
    @aws_cognito_user_pools(cognito_groups: ["Admins", "Caretakers"])

  getAllBookingsPerApartment(apartmentId: String!): [Booking!]!
    @aws_cognito_user_pools(cognito_groups: ["Admins", "Caretakers"])
}

input CreateBookingInput {
  userId: String!
  apartmentId: String!
  startDate: AWSDate!
  endDate: AWSDate!
  bookingStatus: BookingStatus!
}

input BuildingInput {
  name: String!
  userId: String!
  numberOfApartments: Int!
  address: AddressInput!
}

type Address @aws_cognito_user_pools {
  streetAddress: String!
  postalCode: String!
  city: String!
  country: String!
}
input AddressInput {
  streetAddress: String!
  postalCode: String!
  city: String!
  country: String!
}
type User @aws_cognito_user_pools {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
  verified: Boolean!
  userType: UserType!
  updatedOn: AWSDateTime
  createdOn: AWSDateTime!
}
type Booking @aws_cognito_user_pools {
  id: ID!
  userId: String!
  user: User!
  startDate: AWSDate!
  endDate: AWSDate!
  apartmentId: String!
  bookingStatus: BookingStatus!
  updateOn: AWSDateTime!
  createdOn: AWSDateTime!
}

enum BookingStatus {
  PENDING
  APPROVED
  CANCELLED
}

input UserInput {
  firstName: String!
  lastName: String!
  email: String!
  verified: Boolean!
  userType: UserType!
}

input UpdateUserInput {
  firstName: String!
  lastName: String!
  verified: Boolean!
  userType: UserType!
}

type Building @aws_cognito_user_pools {
  id: ID!
  userId: String!
  name: String!
  address: Address!
  numberOfApartments: Int!
  apartments: [Apartment!]
  updateOn: AWSDateTime!
  createdOn: AWSDateTime!
}

type Apartment @aws_cognito_user_pools {
  id: ID!
  apartmentNumber: String!
  building: Building!
  tenant: User!
  caretaker: User!
  apartmentType: ApartmentType!
  apartmentStatus: ApartmentStatus!
  kitchen: Boolean!
  numberOfRooms: Int!
  createdOn: AWSDateTime!
}

input ApartmentInput @aws_cognito_user_pools {
  apartmentNumber: String!
  buildingId: String!
  numberOfRooms: Int!
  apartmentType: ApartmentType!
  apartmentStatus: ApartmentStatus!
}
type UsersResult @aws_cognito_user_pools {
  items: [User!]!
  nextToken: String
}

input Pagination {
  limit: Int
  nextToken: String
}

enum ApartmentType {
  SINGLE_ROOM
  DOUBLE_ROOM
  VILLA
}
enum ApartmentStatus {
  VACANT
  OCCUPIED
}
enum UserType {
  ADMIN
  TENANT
  CARETAKER
}
```

In the schema file above, we have different access levels for mutations and queries. For example,

- Only `Admin` can create a building or an apartment.
- Both `Admins` and `Caretakers` can `getAllBookingsPerApartment`. And a lot more.

Let’s go ahead to define

- GraphQL API
- GraphQL Schema
- GraphQL Datasource

Since we’ll be needing the graphql api and datasource construct definitions in other stacks, we need to expose them.

Here’s how it’s done. Firstly, initialize your construct like so

```jsx
export class AcmsStack extends Stack {
  public readonly acmsGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly acmsTableDatasource: CfnDataSource;
```

Then, define them like so

```jsx
/**
 * GraphQL API
 */
this.acmsGraphqlApi = new CfnGraphQLApi(this, "acmsGraphqlApi", {
  name: "ACMS",
  authenticationType: "API_KEY",

  additionalAuthenticationProviders: [
    {
      authenticationType: "AMAZON_COGNITO_USER_POOLS",

      userPoolConfig: {
        userPoolId: userPool.userPoolId,
        awsRegion: "us-east-2",
      },
    },
  ],
  userPoolConfig: {
    userPoolId: userPool.userPoolId,
    defaultAction: "ALLOW",
    awsRegion: "us-east-2",
  },

  logConfig: {
    fieldLogLevel: "ALL",
    cloudWatchLogsRoleArn: cloudWatchRole.roleArn,
  },
  xrayEnabled: true,
});

/**
 * Graphql Schema
 */

this.apiSchema = new CfnGraphQLSchema(this, "ACMSGraphqlApiSchema", {
  apiId: this.acmsGraphqlApi.attrApiId,
  definition: readFileSync("./schema/schema.graphql").toString(),
});

this.acmsTableDatasource = new CfnDataSource(
  this,
  "AcmsDynamoDBTableDataSource",
  {
    apiId: this.acmsGraphqlApi.attrApiId,
    name: "AcmsDynamoDBTableDataSource",
    type: "AMAZON_DYNAMODB",
    dynamoDbConfig: {
      tableName: this.acmsDatabase.tableName,
      awsRegion: this.region,
    },
    serviceRoleArn: dynamoDBRole.roleArn,
  }
);
```

The default authentication type for the GraphQl api is the `API_KEY`.

With this auth type, users can see a list of all available buildings on the platform. But they’ll need to be signed in and assigned to a particular group, in-order to progress through the rest of the api endpoints.

## Outputs

```jsx
new CfnOutput(this, "UserPoolId", {
  value: userPool.userPoolId,
});
new CfnOutput(this, "UserPoolClientId", {
  value: userPoolClient.userPoolClientId,
});

new CfnOutput(this, "GraphQLAPI ID", {
  value: this.acmsGraphqlApi.attrApiId,
});

new CfnOutput(this, "GraphQLAPI URL", {
  value: this.acmsGraphqlApi.attrGraphQlUrl,
});
```

You can view the complete code [here](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/acms-stack.ts)

## User Stack

In this stack, we’ll define all infrastructure related to the user entity.

For this tutorial, we have 2 user related endpoints defined in the `schema.graphql` file.

But we will implement  `createUserAccount` endpoint only.

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools
deleteUserAccount(id: ID!): Boolean! @aws_cognito_user_pools
```

Create a file called `user-lambda-stack.ts` in the `lib` folder. Remember that when we created the main stack above, we made a couple of resources public, meaning they could be shared and used within stacks.

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

## Lambda Resolver

Inside the `lib` folder, create another folder called `lambda-fns`. This folder would contain code for all our lambda functions and entities.
Let’s create files and folders specific to the user endpoints and entities.

Inside the `lambda-fns` folder, create another folder called `user`.Create 3 typescript files inside the `user` folder.

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

## Testing CreateUserAccount

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
```

We’ll be doing tests from the Appsync console. Sign into your AWS console and navigate to you AppSync. Click on your project name form the Appsync console, once the project is open, navigate to Queries on the left hand-side menu of the screen.

![Screen Shot 2022-09-15 at 11.18.03.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_11.18.03.png)

Let’s create a user account, using the `createUserAccount` mutation and an `apikey`. 

You’ll get the error `Not Authorized to access createUserAccount on type Mutation`.That’s because we added the directive `@aws_cognito_user_pool` , which requires a user to be signed in, before accessing that endpoint. 

Therefore, we need to create a new user in Cognito and then use that user to access the endpoints in our API.

From the aws console search bar, type cognito and open up the cognito user pools page.

Navigate to your project and create a new user.

![Screen Shot 2022-09-15 at 11.22.13.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_11.22.13.png)

Once created, go back to your project on Appsync and sign in with the username and password you just created.

![Screen Shot 2022-09-16 at 13.54.06.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-16_at_13.54.06.png)

![Screen Shot 2022-09-15 at 11.21.39.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_11.21.39.png)

Once logged in, run the endpoint again. If everything goes smoothly, you’ll see a result similar to this, based on the inputs you gave.

![Screen Shot 2022-09-15 at 11.51.12.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_11.51.12.png)

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

### Testing the createBuilding Endpoint

```tsx
createBuilding(input: BuildingInput!): Building!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])
```

This endpoint is only accessible to users belonging the the group `Admins` .

So the first step is to go to your project in Cognito, create a group called `Admins` and add the user you created above to that group.

![Screen Shot 2022-09-16 at 15.18.10.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-16_at_15.18.10.png)

Navigate back to your Appsync project, fill in the endpoints input and run it. If everything goes smoothly, you should see this, based on the input you added.

![Screen Shot 2022-09-15 at 14.21.34.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_14.21.34.png)

### Apartments Stack.

The apartment stack follows the same concept  and code structure as the user and building stacks. 

So we’ll dive straight to testing.

You can grab the complete code here.

[https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/apartment-lambda-stack.ts](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/apartment-lambda-stack.ts)

### Testing Apartment Stack

```graphql
createApartment(input: ApartmentInput): Apartment!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])
```

This endpoint is only accessible to users belonging the the group `Admins` .

Since we already have a user belonging to this group, we’ll just go ahead and run the endpoint.

![Screen Shot 2022-09-15 at 14.40.19.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-15_at_14.40.19.png)

You can also run the endpoint multiple times with different inputs, to create multiple apartments for that building.

### Bookings stack

The booking stack is interesting. Let’s take a look at the booking architecture again.

![Screen Shot 2022-09-16 at 16.03.05.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-16_at_16.03.05.png)

So basically, when a user creates a booking, a message containing the booking details is bundled up by a lambda and sent to an SQS Queue. 

Another lambda function polls the messages from SQS and saves them into a dynamoDb table.

If a message can’t be processed, it is sent to a Dead Letter Queue(DLQ). Once in DLQ, the message can be reviewed and deleted or reprocessed if need be.

We used SQS here in-order to: 

- Decouple the app and make it more scalable.
- Not loose any bookings when too many requests are made at same time.

Back to the IDE. Let’s go ahead and create the necessary files and folders that’ll contain the code for this stack.

Inside `lib` folder, create a file called `booking-lamda-stack.ts` to define resources related to the booking stack.Then inside `lib\lambda-fns` , create a folder called `booking`. 

Inside the `booking` folder, create these :

1. `app.ts` 
2. `createApartmentBooking.ts`
3. `confirmBooking.ts`
4. `CreateBookingInput.ts`
5. `processSqsBooking.ts`

Then create this folder:

- `entities`

Here’s how the directory structure for the booking stack looks like

![Screen Shot 2022-09-23 at 17.37.28.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-23_at_17.37.28.png)

The `booking-lambda-stack.ts` contains 2 lambdas.

The first lambda `CreateApartmentBooking.ts` acts as the lambda resolver for the appsync endpoint `createApartmentBooking`.

This lambda function takes the below input, bundles it up and sends it to an SQS queue.

Before sending to SQS , the function first checks  to see if this particular user has a `PENDING`  booking status for this apartment. 

If a user’s booking status for an apartment is  `PENDING` , they can’t make subsequent bookings for same apartment.

The second lambda function `processSqsBooking.ts` polls for bookings(messages) in the queue and saves them to dynamoDB.

In this fashion, we have completely decoupled the application, making it more scalable and performant, by taking booking processing, off the main thread.

```graphql
input CreateBookingInput {
  userId: String!
  apartmentId: String!
  startDate: AWSDate!
  endDate: AWSDate!
  bookingStatus: BookingStatus!
}
enum BookingStatus {
  PENDING
  APPROVED
  CANCELLED
}
```

Let’s get started.

We’ll create the SQS queue and assign a Dead Letter Queue(DLQ) to it with a `maxReceiveCount` of 10. Open `booking-lambda-stack.ts` and type in the following code.

```tsx
const dlq = new sqs.Queue(this, "DeadLetterQueue");
    const queue = new sqs.Queue(this, "bookingQueue", {
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 10,
      },
    });
```

Now, let’s add the 2 functions

```tsx
/**
     * booking function
     */
    const bookingLambda: NodejsFunction = new NodejsFunction(
      this,
      "AcmsBookingHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "lambda-fns/booking", "app.ts"),
        initialPolicy: [policyStatement],
        role: lambdaRole,

        memorySize: 1024,
      }
    );

    /**
     * Process SQS Messages Lambda
     */
    const processSQSLambda: NodejsFunction = new NodejsFunction(
      this,
      "ProcessSqSBookingHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "lambda-fns/booking",
          "processSqsBooking.ts"
        ),
        initialPolicy: [policyStatement],
        role: lambdaQueueRole,

        memorySize: 1024,
      }
    );
```

Let’s attach the SQS consuming lambda(processSQSLambda) function to and SQS event source

```tsx
/**
     * lambda to sqs
     */

    const eventSourceMapping = new lambda.EventSourceMapping(
      this,
      "QueueConsumerFunctionBookingEvent",
      {
        target: processSQSLambda,
        batchSize: 10,
        eventSourceArn: queue.queueArn,
        reportBatchItemFailures: true,
      }
    );
```

Don’t forget the datasource and the resolver

```tsx
const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "ACMSBookingLambdaDatasource",
      {
        apiId: acmsGraphqlApi.attrApiId,
        name: "ACMSBookingLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: bookingLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const createApartmentBookingResolver: CfnResolver = new CfnResolver(
      this,
      "createApartmentBookingResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createApartmentBooking",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
```

Then permissions and environment variables

```tsx
    createApartmentBookingResolver.addDependsOn(apiSchema);
    getResultBookingPerApartmentResolver.addDependsOn(apiSchema);
    acmsDatabase.grantReadData(processSQSLambda);
    acmsDatabase.grantReadData(bookingLambda);
    queue.grantSendMessages(bookingLambda);
    queue.grantConsumeMessages(processSQSLambda);
    bookingLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
    bookingLambda.addEnvironment("BOOKING_QUEUE_URL", queue.queueUrl);
```

Grab the complete code for this file [here]([https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/booking-lambda-stack.ts](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/booking-lambda-stack.ts))

### `CreateApartmentBooking.ts`

As we mentioned earlier, we need to first check for any PENDING bookings by this particular user and the apartment.

We use a Global Secondary Index called `getAllApartmentsPerUser` and a filter to get all PENDING  apartment bookings for this user.

```tsx
const params = {
    TableName: tableName,
    IndexName: "getAllApartmentsPerUser",
    KeyConditionExpression: "#GSI1PK = :GSI1PK AND #GSI1SK = :GSI1SK",
    FilterExpression: "#bookingStatus = :bookingStatus",
    ExpressionAttributeNames: {
      "#GSI1PK": "GSI1PK",
      "#GSI1SK": "GSI1SK",
      "#bookingStatus": "bookingStatus",
    },
    ExpressionAttributeValues: {
      ":GSI1PK": `USER#${appsyncInput.input.userId}`,
      ":GSI1SK": `APARTMENT#${appsyncInput.input.apartmentId}`,
      ":bookingStatus": "PENDING",
    },
  };

  //We want to make sure this particular user doesn't already have a pending booking for this apartment.
  const response = await documentClient.query(params).promise();
```

And then, we proceed, based on the response of the query.

```tsx
if (response.Count != null) {
    //No pending booking, send booking to SQS

    if (response.Count <= 0) {
      logger.info(`sqs pre message ${JSON.stringify(bookingInput.toItem())}`);
      logger.info(`sqs  queue url ${BOOKING_QUEUE_URL}`);
      var sqsParams: SQS.Types.SendMessageRequest = {
        MessageBody: JSON.stringify(bookingInput.toItem()),
        QueueUrl: BOOKING_QUEUE_URL,
      };

      try {
        await sqs.sendMessage(sqsParams).promise();
        return true;
      } catch (error) {
        logger.info(`an error occured while sending message to sqs", ${error}`);
        throw Error(`an error occured while sending message to sqs", ${error}`);
      }
    }
    //Pending Booking,don't send any message to SQS
    else {
      throw new Error("You Already have a pending booking for this apartment");
    }
  } else {
    throw new Error("Error Querying pending bookings");
  }
```

### `processSqsBooking.ts`

In this function, we poll the messages from the SQS queue and save them to dynamoDB

```tsx
const promises = event.Records.map(async (value: SQSRecord) => {
    try {
      const bookingDetails: PutItemInputAttributeMap = JSON.parse(value.body);
      if (tableName === undefined) {
        logger.error(`Couldn't get the table name`);
        tableName = "AcmsDynamoDBTable";
      }
      const params = {
        TableName: tableName,
        Item: bookingDetails,
      };

      logger.info(`put parameters for booking is ${JSON.stringify(params)}`);
      await documentClient.put(params).promise();
    } catch (error) {
      logger.error(
        `an error occured during put booking ${JSON.stringify(error)}`
      );
      failedMessageIds.push(value.messageId);
    }
  });
  // execute all promises
  await Promise.all(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => {
      return {
        itemIdentifier: id,
      };
    }),
  };
```

Grab the complete code on [Github](https://github.com/trey-rosius/apartment_complex_management_system).

Deploy your CDK application and test.

### Testing `createApartmentBooking` Endpoint

Sign into your appsync account on the aws console, navigate to your project and run the following mutation.

```graphql
mutation create {
createApartmentBooking(input: {apartmentId: "2F6hDMkdfeX4wQau7Bhoi7cOuAH",
 bookingStatus: PENDING, endDate: "2022-10-22", startDate: "2022-09-22", 
userId: "[treyrosius@gmail.com](mailto:treyrosius@gmail.com)"})
}
```

Change the values of the `apartmentId` and `userId` to match those in your dynamoDB table.

If the mutation runs successfully, a `true` is returned.

![Screen Shot 2022-09-25 at 12.58.25.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-25_at_12.58.25.png)

If we go to `processSqsBooking` lambda and look at it’s logs, we see that it has received a message. 

![Screen Shot 2022-09-25 at 13.01.06.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-25_at_13.01.06.png)

Then, the lambda would save this message into dynamoDB.

![Screen Shot 2022-09-25 at 12.59.11.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-25_at_12.59.11.png)

If you attempt to run the mutation again with same values for `userId` and `apartmentId`, meaning that the same user wants to book the same apartment, with a previous `PENDING` booking status already in the system, the mutation fails.

`You already have a pending booking for this apartment`

![Screen Shot 2022-09-25 at 12.56.19.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-09-25_at_12.56.19.png)

Please create multiple users and create bookings with each of those users. We’ll be needing them in the next step.

After creating multiple bookings for an apartment, we want to give the building owner(Admin), a way to retrieve all bookings for each of their apartments, in-order to `APPROVE` or `DENY` a booking.

### Get All Bookings Per Apartment

In-order for an admin to approve a booking for an apartment, they should be able to first grab a list of all bookings for that said apartment.

Grabbing all bookings per apartment requires an `apartmentId`

Here’s the endpoint

```graphql
getAllBookingsPerApartment(apartmentId: String!): [Booking!]!
    @aws_cognito_user_pools
```

The result of this endpoint is a list of `Booking` which also contains a `user` object, depicting the user who made the booking.

```json
"getAllBookingsPerApartment": [
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGKty2bIUaLr0C4Hc513rkX5oT",
        "startDate": "2022-09-22",
        "userId": "treyrosius@gmail.com",
        "user": {
          "email": "treyrosius@gmail.com",
          "firstName": "Rosius",
          "id": "2FGJzw5eiS5pWDUwH9r1PkjROYV",
          "lastName": "Ndimofor Ateh",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVn4SwbXF8LUsID3tY9lWTziO",
        "startDate": "2022-09-22",
        "userId": "test@gmail.com",
        "user": {
          "email": "test@gmail.com",
          "firstName": "Steve",
          "id": "2FGK3F4WKV28Y9edwsgUjn9gIuG",
          "lastName": "Rosius",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVr0WV3cqyIJSqOQc7kN4HwFg",
        "startDate": "2022-09-22",
        "userId": "tony@gmail.com",
        "user": {
          "email": "tony@gmail.com",
          "firstName": "Stark",
          "id": "2FGK8BOvlQMDWcQarYtTR2RAQ7a",
          "lastName": "Tony",
          "userType": "TENANT",
          "verified": true
        }
      }
    ]
```

A Single booking object looks like this

```json
 {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGKty2bIUaLr0C4Hc513rkX5oT",
        "startDate": "2022-09-22",
        "userId": "treyrosius@gmail.com",
        "user": {
          "email": "treyrosius@gmail.com",
          "firstName": "Rosius",
          "id": "2FGJzw5eiS5pWDUwH9r1PkjROYV",
          "lastName": "Ndimofor Ateh",
          "userType": "ADMIN",
          "verified": true
        }
      }
```

Taking a look at the above object, 2 calls where made.

- Get booking
- Get user per booking

We’ll use a Pipeline Resolver coupled with VTL  to easily accomplish this task.

Don’t know about pipeline resolvers yet ? Checkout this well elaborated blog post on how it works.

[Pipeline resolver with cdk,typscript and graphql]([https://phatrabbitapps.com/pipeline-resolvers-with-cdk-v2-typescript-and-graphql](https://phatrabbitapps.com/pipeline-resolvers-with-cdk-v2-typescript-and-graphql))

Inside the file `booking-lambda-stack.ts`, we have to create 2 functions and a resolver.

Function 1 would have request and response mapping templates to `get_all_bookings_apartment`.

Function 2 would have request and response mapping templates to `get_user_per_booking`.

The Resolver would combine both functions and return the results.

Let’s see how that happens in Code.

Inside `lib` folder, create a folder called `vtl` which would contain all our vtl templates . Inside the `vtl` folder, create a file called `before_mapping_template.vtl.`

This file gets the inputs to our endpoint and prepares it to be passed on to the first function. 

In this case, we’ve got just one input which is `apartmentId`.

Type the following code into the created vtl file.

```
#set($result = { "apartmentId": $ctx.args.apartmentId })
$util.toJson($result)
```

Next, create a file called `get_all_bookings_per_apartment_request.vtl` and type in the following code

```

#set($pk = $util.dynamodb.toStringJson("APARTMENT#${ctx.prev.result.apartmentId}"))
 #set($sk =$util.dynamodb.toStringJson("BOOKING#"))
{
    "version" : "2018-05-29",

    "operation" : "Query",
    "limit": $util.toJson($limit),
    "nextToken": $util.toJson($ctx.args.nextToken),
    "query" : {
        "expression": "#PK = :pk and begins_with(#SK,:sk)",
        "expressionNames":{
        "#PK":"PK",
        "#SK":"SK"
        },
        
        "expressionValues" : {
            ":pk" : $pk,
            ":sk" :$sk
        }
    },
    "scanIndexForward" : true

}
```

Notice how we get the `apartmentId` we sent from the previous template. `ctx.prev.result.apartmentId`

Also notice how we’ve used the `begins_with` query function to get all bookings per apartment.

Create a file called `get_all_bookings_per_apartment_responds.vtl` and type in the following code.

```
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end

$util.toJson($ctx.result)
```

When we get all bookings, each booking object contains a userId. We want to use each `userId` to get the `user` who made the booking for each booking.

In this scenario, we have to use a `GetBatchItem` query, to get all `user` objects at once, instead of individually. It can be used in order to retrieve up to **100 DynamoDB items** in one single DynamoDB request.

This would help limit the number of requests the api makes to dynamoDB and hence speed up our application.

Inside the `vtl` folder, create a file called `get_user_per_booking_request.vtl` and type in the following code.

```
#if($ctx.prev.result.items.size() == 0)
    #return([{}])
#end
#set($keys=[])
#foreach($item in $ctx.prev.result.items)
  $util.qr($keys.add({
    "PK": $util.dynamodb.toDynamoDB("USER#${item.userId}"),
    "SK": $util.dynamodb.toDynamoDB("USER#${item.userId}")
  }))
#end
{
    "version": "2018-05-29",
    "operation": "BatchGetItem",
    "tables" : {
        "AcmsDynamoDBTable": {
            "keys": $util.toJson($keys),
            "consistentRead": true
        }
    }
}
```

From the code above, firstly, we want to do a quick return if there are no available bookings for the apartment. 

If not, then we want to extract the `userId's` of all bookings and create a set of keys to retrieve a list of `user` objects at once using `BatchGetItem`.

Create another file called `get_user_per_booking_responds.vtl` and type in the following code.

```
#set($items= [])
#foreach($item in $ctx.result.data.get("AcmsDynamoDBTable"))
    #set($user=$ctx.prev.result.items.get($foreach.index))
    $util.qr($user.put("user",$item))
    $util.qr($items.add($user))
#end
$util.toJson($items)
```

After retrieving a list of `user` objects, we want to re-assign each user object to their individual bookings.

Create a file called `after_mapping_template.vtl`  and type in the following code.

```
$util.toJson($ctx.result)

```

This file returns the result of the entire process to the resolver.

Now, we have to open up the booking stack and defined 2 functions and a resolver for get all bookings per apartment.

```tsx
const getAllBookingsByApartmentFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getAllBookingsFunction", {
        apiId: acmsGraphqlApi.attrApiId,

        dataSourceName: acmsTableDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_all_bookings_per_apartment_request.vtl"
        ).toString(),
        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_all_bookings_per_apartment_response.vtl"
        ).toString(),
        functionVersion: "2018-05-29",
        name: "getAllBookingsFunction",
      });

    const getUserPerBookingsFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getUserPerBookingFunction", {
        apiId: acmsGraphqlApi.attrApiId,

        dataSourceName: acmsTableDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_user_per_booking_request.vtl"
        ).toString(),
        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_user_per_booking_response.vtl"
        ).toString(),
        functionVersion: "2018-05-29",
        name: "getUserPerBookingFunction",
      });

    const getResultBookingPerApartmentResolver: CfnResolver = new CfnResolver(
      this,
      "getResultBookingPerApartmentResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllBookingsPerApartment",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            getAllBookingsByApartmentFunction.attrFunctionId,
            getUserPerBookingsFunction.attrFunctionId,
          ],
        },

        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/before_mapping_template.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/after_mapping_template.vtl"
        ).toString(),
      }
    );
```

For the resolver, notice the `kind:PIPELINE` and `pipelineConfig`

Don’t forget to grab the complete code here [https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/booking-lambda-stack.ts](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/booking-lambda-stack.ts)

## Testing `getAllBookingsPerApartment` endpoint.

Open up your appsync app in the aws console and run the query `getAllBookingsPerApartment`.Make sure you use an `apartmentId` for an apartment that has multiple booking.

![Screen Shot 2022-10-24 at 15.50.53.png](Welcome%20to%20the%20Apartment%20Complex%20Management%20System%20862451ae82b44079888cc723d8470957/Screen_Shot_2022-10-24_at_15.50.53.png)

```tsx
{
  "data": {
    "getAllBookingsPerApartment": [
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGKty2bIUaLr0C4Hc513rkX5oT",
        "startDate": "2022-09-22",
        "userId": "treyrosius@gmail.com",
        "user": {
          "email": "treyrosius@gmail.com",
          "firstName": "Rosius",
          "id": "2FGJzw5eiS5pWDUwH9r1PkjROYV",
          "lastName": "Ndimofor Ateh",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVn4SwbXF8LUsID3tY9lWTziO",
        "startDate": "2022-09-22",
        "userId": "test@gmail.com",
        "user": {
          "email": "test@gmail.com",
          "firstName": "Steve",
          "id": "2FGK3F4WKV28Y9edwsgUjn9gIuG",
          "lastName": "Rosius",
          "userType": "ADMIN",
          "verified": true
        }
      },
      {
        "apartmentId": "2FGKLMWeMiCJeMZH9OqxEFR0sgh",
        "bookingStatus": "PENDING",
        "endDate": "2022-10-22",
        "id": "2FGVr0WV3cqyIJSqOQc7kN4HwFg",
        "startDate": "2022-09-22",
        "userId": "tony@gmail.com",
        "user": {
          "email": "tony@gmail.com",
          "firstName": "Stark",
          "id": "2FGK8BOvlQMDWcQarYtTR2RAQ7a",
          "lastName": "Tony",
          "userType": "TENANT",
          "verified": true
        }
      }
    ]
  }
}
```

Notice that each booking as a user object. We don’t have to make an api request to get the `user` object separately.

## Conclusion

For this tutorial series, i’ll end here, but that doesn’t mean you should. As an exercise, try implementing the `dynamoDB streams` feature  and `sns` on your own, as shown on the solutions architecture.

The full working code is in the github repo to serve as a guide.

I’ll really love to see how you use this tutorial and what you improved on. 

Please Leave a like or comment on what you loved or didn’t love about this piece.

Thanks for reading and stay tuned in for the next series coming up shortly.

Peace✌🏾