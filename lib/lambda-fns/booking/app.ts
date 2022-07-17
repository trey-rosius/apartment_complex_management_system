import { Logger } from "@aws-lambda-powertools/logger";
import createApartmentBooking from "./createApartmentBooking";
import { AppSyncResolverEvent, Context } from "aws-lambda";
import CreateBookingInput from "./CreateBookingInput";
import getBookingsPerApartment from "./getBookingsPerApartment";
import { Tracer } from "@aws-lambda-powertools/tracer";

const namespace = "ApartmentComplexManagementApp";
const serviceName = "bookingHandler";

const logger = new Logger({ logLevel: "INFO", serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

exports.handler = async (
  event: AppSyncResolverEvent<CreateBookingInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartmentBooking":
      return await createApartmentBooking(event.arguments, logger);
    case "getBookingsPerApartment":
      return await getBookingsPerApartment(event.arguments.apartmentId, logger);

    default:
      return null;
  }
};
