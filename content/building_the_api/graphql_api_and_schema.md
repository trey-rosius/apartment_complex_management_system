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
