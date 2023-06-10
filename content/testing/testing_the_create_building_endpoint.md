### Testing the createBuilding Endpoint

```tsx
createBuilding(input: BuildingInput!): Building!
    @aws_cognito_user_pools(cognito_groups: ["Admins"])
```

This endpoint is only accessible to users belonging the the group `Admins` .

So the first step is to go to your project in Cognito, create a group called `Admins` and add the user you created above to that group.

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/create_building_stack.png)

Navigate back to your Appsync project, fill in the endpoints input and run it. If everything goes smoothly, you should see this, based on the input you added.


![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/create_building_stack_2.png)
