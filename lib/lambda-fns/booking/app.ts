import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverEvent, Context } from "aws-lambda";
import CreateBookingInput from "./CreateBookingInput";

import { Tracer } from "@aws-lambda-powertools/tracer";
import createApartmentBooking from "./createApartmentBooking";

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
    `appsync event arguments ${JSON.stringify(
      event.arguments.input
    )} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartmentBooking":
      return await createApartmentBooking(event.arguments, logger);

    default:
      return null;
  }
};
