### Bookings stack

The booking stack is interesting. Let’s take a look at the booking architecture again.


![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/booking_stack.png)

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

![alt text](https://raw.githubusercontent.com/trey-rosius/apartment_complex_management_system/master/assets/booking_stack_2.png)

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
