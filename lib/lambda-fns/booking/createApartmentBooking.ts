import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import CreateBookingInput from "./CreateBookingInput";

async function createApartmentBooking(
  input: CreateBookingInput,
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
}

export default createApartmentBooking;
