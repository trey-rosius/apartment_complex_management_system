## Welcome to the Apartment Complex Management System(ACMS) Serverless Application

## Concept

ACMS is an attempt at using Serverless technology to build a system where building owners can:

- Create an account.
- Register the buildings(name, address, number of apartments etc) that they own.
- Assign and keep Caretakers to manage each of those buildings.
- Keep track of the tenants occupying the apartments in the building.
- Keep track of occupied and vacant apartments, bookings,payments, and a lot more in each of their building.
- And other useful information that’ll provide more insights on the management of their buildings.

In this series, we'll build and deploy a serverless GraphQL API with Appsync,CDK and Typescript.

## Solutions Architecture

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/apartment.jpeg)

## ERD(Entity Relationship Diagram)

### Entities

- Buildings(A building has many apartments)
- Apartments(Apartments are in buildings)
- Bookings(Each apartment can have multiple pending bookings. Once a booking has been approved, payment can be made. )
- Notifications(Light, Water, internet bills due)
- Payments(Before payment, booking status equals Approved. After payment, booking status equals PAID )
- Users(Administrators,CareTakers, Tenants)

### Relationships between entities

Buildings and Apartments share a one to many relationship(one building can have multiple apartments)

Apartments and Bookings share a one to many relationship(One Apartment can have multiple bookings. Whoever pays first gets in)

Users and Apartments share a one to many relationship(One user can have multiple apartments)

Users and Bookings share a one to many relationship(One user can create multiple bookings)

Users and Payments share a one to many relationship

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/entity_relationship_apartment.jpeg)

# Access Patterns

Administrator

- Create/update/delete Administrator accounts.

```jsx
PK:USER#USERNAME
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
PK:USER#USERNAME
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

### Single Table Design DATABASE SCHEMA

| Entity                 | PK                  | SK                    | GSI1PK                | GSI1SK              |
| ---------------------- | ------------------- | --------------------- | --------------------- | ------------------- |
| Building               | BUILDING            | BUILDING#BUILDINGID   | USER#USERID           | BUILDING#BUILDINGID |
| Apartment              | BUILDING#BUILDINGID | APARTMENT#APARTMENTID |                       |                     |
| Booking                | USER#USERID         | APARTMENT#APARTMENTID | APARTMENT#APARTMENTID | BOOKING#BOOKINGID   |
| Payment                | USER#USERID         | PAYMENT#PAYMENTID     | APARTMENT#APARTMENTID | PAYMENT#PAYMENTID   |
| User                   | USER#USERID         | USER#USEREMAIL        |                       |                     |
| Messages/Notifications | USER#USERID         | MESSAGE#MESSAGEID     |                       |                     |

## NOSQL WORKBENCH

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/acms-table.png)

### Get All Apartments Per Building

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllApartmentsPerBuilding.png)

### Get All Bookings Per Apartment

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBookingsPerApartment.png)

### Get All Buildings Per User

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/GSI_acms-table_getAllBuildingsPerUser.png)

## Prerequisites

Please make sure you have these dependencies installed before proceeding.

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- [AWS ACCOUNT AND USER](https://cdkworkshop.com/15-prerequisites/200-account.html)
- [Node Js](https://cdkworkshop.com/15-prerequisites/300-nodejs.html)
- [AWS CDK ToolKit](https://cdkworkshop.com/15-prerequisites/500-toolkit.html)

- [AWS AppSync](https://aws.amazon.com/appsync/) is a fully managed serverless service that makes it easy to develop GraphQL APIs in the cloud. It handles the heavy lifting of managing a complex GraphQL backend infrastructure, securely connecting to data sources, adding caches to improve performance, subscriptions to support real-time updates, and client-side data stores that keep offline clients in sync.

- GraphQL provides a flexible typed data query language for APIs as well as a runtime to fulfill these queries

- The [AWS Cloud Development Kit (AWS CDK)](https://aws.amazon.com/cdk/) is an open-source software development framework to define your cloud application resources using familiar programming languages

## GET STARTED

### Initialize CDK app

Firstly, create a new project directory. I’m using a mac, so i’ll create mine and cd into it

`mkdir acms`

`cd acms`

Create a CDK typescript application in your newly created directory

`cdk init --language typescript`

Once created, open up the newly created CDK app in your favorite IDE.

### Stacks

We are going to have 6 stacks in total.

- The main application Stack(Defines the Appsync API, Database, Datasource etc for the complete app)
- A User Stack (For User Resources)
- A Building Stack (For Building Resources)
- An Apartment Stack (For Apartment Resources)
- A Bookings Stack (For Booking Resources)
- DynamoDb Stream Stack

To provision infrastructure resources, all constructs that represent AWS resources must be defined, directly or indirectly, within the scope of a Stack construct.

An App is a container for one or more stacks: it serves as each stack's scope. Stacks within a single App can easily refer to each others' resources (and attributes of those resources).

The AWS CDK infers dependencies between stacks so that they can be deployed in the correct order. You can deploy any or all of the stacks defined within an app at with a single cdk deploy command.

Our app is defined in the `bin` folder, while our stacks are in the `lib` folder.

Add your `account` and `region` to the `env` object in the cdk app file located in the `bin` folder.

Here's how mine looks like

```js
const app = new cdk.App();
const acmsStack = new AcmsStack(app, "AcmsStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});
```

`AcmsStack` file is located the `lib` folder.

### ACMS Stack

In this stack construct, we are going to provision the following infrastructure resources

- Cognito UserPool
- AppSync GraphQL Api
- DynamoDb Table
- CloudWatch and DynamoDB role managed Policies.

Inside `acms-stack.ts` file located in `lib` folder, we'll defined constructs for the above resources.
And because we'll be using the resources in other stacks, we have to expose the resources somehow. We'll see that in a bit.

### Cognito UserPool

Let's define the userpool and the userpool client

```js
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

In the schema file above, we have different access levels for mutations and queries.
For example,

- Only `Admin` can create a building or an apartment.
- Both `Admins` and `Caretakers` can `getAllBookingsPerApartment`.
  And a lot more.

Let's go ahead to define

- GraphQL API
- GraphQL Schema
- GraphQL Datasource

Since we'll be needing the graphql api and datasource construct definitions in other stacks, we need to expose them.

Here's how it's done.
Firstly, initialize your construct like so

```js
export class AcmsStack extends Stack {
  public readonly acmsGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly acmsTableDatasource: CfnDataSource;

```

Then, define them like so

```js
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

With this authentication type, users can see a list of all available buildings on the platform.
But they'll need to be signed in and assigned to a particular group, in-order to progress through the rest of the api endpoints.

## Outputs

```js
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
