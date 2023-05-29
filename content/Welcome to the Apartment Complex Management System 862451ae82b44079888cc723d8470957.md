




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