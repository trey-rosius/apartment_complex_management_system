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
