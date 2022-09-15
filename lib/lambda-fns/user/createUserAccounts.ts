import { Logger } from "@aws-lambda-powertools/logger";
import UserEntity from "./userEntity";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import UserInput from "./CreateUserInput";

type UserReturnParameters = {
  id: string;
  ENTITY: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  updatedOn: string;
  createdOn: string;
};

async function createUserAccount(
  appsyncInput: UserInput,
  logger: Logger
): Promise<UserReturnParameters> {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const userInput: UserEntity = new UserEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create user input info", ${JSON.stringify(userInput)}`);
  const params = {
    TableName: tableName,
    Item: userInput.toItem(),
    ConditionExpression: "attribute_not_exists(PK)",
  };

  try {
    await documentClient.put(params).promise();
    return userInput.graphQlReturn();
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException")
      logger.error(`an error occured while creating user ${error}`);
    throw Error("A user with same email address already Exist");
  }
}
export default createUserAccount;
