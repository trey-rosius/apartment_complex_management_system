import { Logger } from "@aws-lambda-powertools/logger";
import { AWSError, DynamoDB } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { stringify } from "querystring";

async function getBookingsPerApartment(apartmentId: string, logger: Logger) {
  const documentClient = new DynamoDB.DocumentClient();

  let tableName = process.env.ACMS_DB;
  let userIds: string[];
  let ids: string[];

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  logger.info(`apartment id is ", ${apartmentId}`);

  var params: DynamoDB.DocumentClient.QueryInput = {
    TableName: tableName,
    IndexName: "bookingsPerApartment",
    KeyConditionExpression: "GSI1PK = :gsi1pk and begins_with(GSI1SK,:gsi1SK)",
    ExpressionAttributeValues: {
      ":gsi1pk": `APARTMENT#${apartmentId}`,
      ":gsi1SK": `BOOKING#`,
    },
    ScanIndexForward: true,
  };
  try {
    var docClientResult: PromiseResult<
      DynamoDB.DocumentClient.QueryOutput,
      AWSError
    > = await documentClient.query(params).promise();

    logger.info(`results ${JSON.stringify(docClientResult.Items)}`);

    if (docClientResult.Items === undefined) {
      throw new Error("result is undefined");
    }
    if (docClientResult.Items.length == 0) {
      return [];
    }
    const results: DynamoDB.DocumentClient.AttributeMap[] =
      docClientResult.Items;

    const userIds = results.map(
      (item: DynamoDB.DocumentClient.AttributeMap, index: number) =>
        ids.push(item.userId)
    );

    logger.info(`user ids ${JSON.stringify(userIds)}`);

    return results;
  } catch (error) {
    logger.error(JSON.stringify(error));
    throw Error(`an error occured ${error}`);
  }
}

export default getBookingsPerApartment;
