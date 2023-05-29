## Testing CreateUserAccount

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
```

We’ll be doing tests from the Appsync console. Sign into your AWS console and navigate to you AppSync. Click on your project name form the Appsync console, once the project is open, navigate to Queries on the left hand-side menu of the screen.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/test_create_account_5.png)

Let’s create a user account, using the `createUserAccount` mutation and an `apikey`. 

You’ll get the error `Not Authorized to access createUserAccount on type Mutation`.That’s because we added the directive `@aws_cognito_user_pool` , which requires a user to be signed in, before accessing that endpoint. 

Therefore, we need to create a new user in Cognito and then use that user to access the endpoints in our API.

From the aws console search bar, type cognito and open up the cognito user pools page.

Navigate to your project and create a new user.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/test_create_account.png)


Once created, go back to your project on Appsync and sign in with the username and password you just created.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/test_create_account_2.png)

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/test_create_account_3.png)

Once logged in, run the endpoint again. If everything goes smoothly, you’ll see a result similar to this, based on the inputs you gave.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/test_create_account_4.png)
