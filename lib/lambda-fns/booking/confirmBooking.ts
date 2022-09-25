import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";

/**
 * When a caretaker confirms a booking from a to be tenant, a series of changes are being made
 * Booking status changes from PENDING ---> BOOKED
 * Apartment status changes from VACANT ---> OCCUPIED
 * All the other bookings status are changed from PENDING --> REJECTED(..that's harsh)
 *
 *
 * @param apartmentId => Apartment Ids
 * @params bookingIds => All booking ids
 * @params bookingId => The Id of the Booking to be confirmed
 * @param logger
 * @returns
 */
async function confirmBooking(
  buildingId: string,
  userId: string,
  bookingId: string,
  bookingIds: string[],
  apartmentId: string,
  logger: Logger
) {
  const documentClient = new DynamoDB.DocumentClient();

  let tableName = process.env.ACMS_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }
  logger.info(`booking ids are ", ${bookingIds}`);
  logger.info(`booking id is ", ${bookingId}`);
  logger.info(`apartment id is ", ${apartmentId}`);

  try {
    const params = {
      TransactItems: [
        {
          Put: {
            Item: {
              PK: `APARTMENT#${apartmentId}`,
              SK: `BOOKING#${bookingId}`,
              bookingStatus: "BOOKED",
            },
            TableName: tableName,
            ConditionExpression: "attribute_exists(PK)",
          },
        },
        {
          Put: {
            Item: {
              PK: `BUILDING#${buildingId}`,
              SK: `APARTMENT#${apartmentId}`,
              apartmentStatus: "OCCUPIED",
            },
            TableName: tableName,
            ConditionExpression: "attribute_exists(PK)",
          },
        },
      ],
    };
    await documentClient.transactWrite(params).promise();
  } catch (error: any) {
    logger.error(JSON.stringify(error));

    let errorMessage = "Could not confirm user booking";
    // If it's a condition check violation, we'll try to indicate which condition failed.
    if (error.code === "TransactionCanceledException") {
      if (error.cancellationReasons[0].Code === "ConditionalCheckFailed") {
        errorMessage = "User booking doesn't exist.";
      } else if (
        error.cancellationReasons[1].Code === "ConditionalCheckFailed"
      ) {
        errorMessage = "apartment doesn't exist.";
      }
    }
    logger.error(errorMessage);
    throw Error(errorMessage);
  }
}

export default confirmBooking;
