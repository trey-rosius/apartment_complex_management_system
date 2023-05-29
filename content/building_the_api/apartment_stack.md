### Apartments Stack.

The apartment stack follows the same concept  and code structure as the user and building stacks. 

So we’ll dive straight to testing.

You can grab the complete code here.

[Complete Code](https://github.com/trey-rosius/apartment_complex_management_system/blob/master/lib/apartment-lambda-stack.ts)

### Testing Apartment Stack

```graphql
createApartment(input: ApartmentInput): Apartment!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])
```

This endpoint is only accessible to users belonging the the group `Admins` .

Since we already have a user belonging to this group, we’ll just go ahead and run the endpoint.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/testing_apartment_stack.png)

You can also run the endpoint multiple times with different inputs, to create multiple apartments for that building.
