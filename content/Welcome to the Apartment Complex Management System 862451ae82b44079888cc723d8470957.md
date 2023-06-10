







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