import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    input: CreateBookingInput;
  };
};

type CreateBookingInput = {
  userId: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  bookingStatus: string;
};

exports.handler = async (event: AppSyncEvent, context: any) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartmentBooking":
      return await createApartmentBooking(event.arguments.input, logger);

    default:
      return null;
  }
};
