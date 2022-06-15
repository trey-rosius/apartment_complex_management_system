import { DynamoDB } from "aws-sdk";
import { uuid } from "../utils";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger();

async function createUserAccount(input: UserInput) {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }
  const userInput = {
    PK: `USER#${input.email}`,
    SK: `USER#${input.email}`,
    id: uuid(),
    ENTITY: "USER",

    ...input,
    createdOn,
  };

  logger.info("create user info", userInput);
  const params = {
    TableName: tableName,
    Item: userInput,
  };

  try {
    await documentClient.put(params).promise();
    return input;
  } catch (err) {
    logger.error(`an error occured while creating user ${err}`);
    return null;
  }
}
export default createUserAccount;
