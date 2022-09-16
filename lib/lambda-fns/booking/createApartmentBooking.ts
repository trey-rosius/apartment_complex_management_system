import { Logger } from "@aws-lambda-powertools/logger";
import { AWSError, DynamoDB, SQS } from "aws-sdk";
import { uuid } from "../../utils";
import CreateBookingInput from "./CreateBookingInput";
import { BookingEntity } from "./entities/bookingEntity";

async function createApartmentBooking(
  appsyncInput: CreateBookingInput,
  logger: Logger
): Promise<boolean> {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;
  let BOOKING_QUEUE_URL = process.env.BOOKING_QUEUE_URL;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  const sqs = new SQS({});

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }
  if (BOOKING_QUEUE_URL === undefined) {
    logger.error(`Couldn't get the queue url name`);
    throw Error("Couldn't get queue url");
  }

  const bookingInput: BookingEntity = new BookingEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create booking input info", ${JSON.stringify(bookingInput)}`);
  const params = {
    TableName: tableName,
    Item: bookingInput.toItem(),
  };

  logger.info(`sqs pre message ${JSON.stringify(bookingInput.toItem())}`);
  logger.info(`sqs  queue url ${BOOKING_QUEUE_URL}`);
  var sqsParams: SQS.Types.SendMessageRequest = {
    MessageBody: JSON.stringify(bookingInput.toItem()),
    QueueUrl: BOOKING_QUEUE_URL,
  };

  try {
    await sqs.sendMessage(sqsParams).promise();
    return true;
  } catch (error) {
    logger.info(`an error occured while sending message to sqs", ${error}`);
    throw Error(`an error occured while sending message to sqs", ${error}`);
  }

  /*
  try {
    await documentClient.put(params).promise();
    return bookingInput.graphQlReturn();
  } catch (error: any) {
    logger.error(
      `an error occured while creating an apartment booking ${error}`
    );
    throw Error(`an error occured ${error}`);
  }

  */
}

export default createApartmentBooking;
