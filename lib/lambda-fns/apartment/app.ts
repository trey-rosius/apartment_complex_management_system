import { Logger } from "@aws-lambda-powertools/logger";
import createApartment from "./createApartment";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    input: ApartmentInput;
  };
};

type ApartmentInput = {
  apartmentNumber: string;
  buildingId: string;
  numberOfRooms: number;
  apartmentType: string;
};
exports.handler = async (event: AppSyncEvent, context: any) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartment":
      return await createApartment(event.arguments.input, logger);

    default:
      return null;
  }
};
