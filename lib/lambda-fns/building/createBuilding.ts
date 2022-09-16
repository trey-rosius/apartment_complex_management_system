import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import { BuildingEntity } from "./entities/buildingEntity";

async function createBuilding(
  appsyncInput: CreateBuildingInput,
  logger: Logger
) {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const input: BuildingEntity = new BuildingEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create building input info", ${JSON.stringify(input)}`);
  const params = {
    TableName: tableName,
    Item: input.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return input.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating a building ${error}`);
    throw Error(`an error occured ${error}`);
  }
}

export default createBuilding;
