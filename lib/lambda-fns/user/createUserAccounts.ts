import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";

async function createUserAccount(input: UserInput, logger: Logger) {
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

  logger.info("create user input info", userInput);
  const params = {
    TableName: tableName,
    Item: userInput,
    ConditionExpression: "attribute_not_exists(PK)",
  };

  try {
    await documentClient.put(params).promise();
    return userInput;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException")
      logger.error(`an error occured while creating user ${error}`);
    throw Error("A user with same email address already Exist");
  }
}
export default createUserAccount;
