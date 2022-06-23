import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import CreateBookingInput from "./CreateBookingInput";
import { BookingEntity } from "./entities/bookingEntity";

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

  const bookingInput: BookingEntity = new BookingEntity({
    id: id,
    ...input,
    createdOn,
  });

  logger.info(`create booking input info", ${bookingInput}`);
  const params = {
    TableName: tableName,
    Item: bookingInput.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return bookingInput.graphQlReturn();
  } catch (error: any) {
    logger.error(
      `an error occured while creating an apartment booking ${error}`
    );
    throw Error(`an error occured ${error}`);
  }
}

export default createApartmentBooking;
