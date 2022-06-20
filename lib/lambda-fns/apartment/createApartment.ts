import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import { ApartmentEntity } from "./entities/apartmentEntity";

type ApartmentInput = {
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
};
async function createApartment(input: ApartmentInput, logger: Logger) {
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
    ...input,
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
