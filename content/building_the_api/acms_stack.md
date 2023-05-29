### ACMS Stack

In this stack construct, we are going to provision the following infrastructure resources

- Cognito UserPool
- AppSync GraphQL Api
- DynamoDb Table
- CloudWatch and DynamoDB role managed Policies.

Inside `acms-stack.ts` file located in `lib` folder, we’ll define constructs for the above resources.

And because we’ll be using the resources in other stacks, we have to expose the resources somehow. 

We’ll see that in a bit.

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
