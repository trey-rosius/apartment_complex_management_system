import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import CreateApartmentInput from "./CreateApartmentInput";

import { ApartmentEntity } from "./entities/apartmentEntity";

async function createApartment(
  appsyncInput: CreateApartmentInput,
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

  const apartmentInput: ApartmentEntity = new ApartmentEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create apartment input info", ${apartmentInput}`);
  const params = {
    TableName: tableName,
    Item: apartmentInput.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return apartmentInput.graphQLReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating an apartment ${error}`);
    throw Error(`an error occured ${error}`);
  }
}

export default createApartment;
