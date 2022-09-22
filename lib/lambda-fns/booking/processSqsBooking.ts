import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";

import { Context, SQSEvent, SQSRecord } from "aws-lambda";

import { Tracer } from "@aws-lambda-powertools/tracer";
import { PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb";

const namespace = "ApartmentComplexManagementApp";
const serviceName = "bookingHandler";

const logger = new Logger({ logLevel: "INFO", serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

exports.handler = async (event: SQSEvent, context: Context) => {
  let tableName = process.env.ACMS_DB;
  const documentClient = new DynamoDB.DocumentClient();
  const failedMessageIds: string[] = [];

  logger.addContext(context);

  logger.info(`SQS events are ${JSON.stringify(event.Records)}`);

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
};
