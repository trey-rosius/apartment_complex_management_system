### Stacks

We are going to have 6 stacks in total.

- The main application Stack(Defines the Appsync API, Database, Datasource etc. for the complete app)
- A User Stack (For User Resources)
- A Building Stack (For Building Resources)
- An Apartment Stack (For Apartment Resources)
- A Bookings Stack (For Booking Resources)
- DynamoDb Stream Stack

To provision infrastructure resources, all constructs that represent AWS resources must be defined, directly or indirectly, within the scope of a Stack construct.

An App is a container for one or more stacks: it serves as each stack’s scope. Stacks within a single App can easily refer to each other's resources (and attributes of those resources).

The AWS CDK infers dependencies between stacks so that they can be deployed in the correct order. You can deploy any or all of the stacks defined within an app with a single cdk deploy command.

Our app is defined in the `bin` folder, while our stacks are in the `lib` folder.

Add your `account` and `region` to the `env` object in the cdk app file located in the `bin` folder.

Here’s how mine looks like

```
const app = new cdk.App();const acmsStack = new AcmsStack(app, "AcmsStack", {  env: { account: "13xxxxxxxxxx", region: "us-east-2" },});
```

`AcmsStack` file is located the `lib` folder.
