import { Logger } from "@aws-lambda-powertools/logger";
import createBuilding from "./createBuilding";
import { AppSyncResolverEvent, Context } from "aws-lambda";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    input: BuildingInput;
  };
};

type BuildingInput = {
  name: string;
  userId: string;
  numberOfApartments: number;
  address: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
};

exports.handler = async (
  event: AppSyncResolverEvent<BuildingInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createBuilding":
      return await createBuilding(event.arguments, logger);

    default:
      return null;
  }
};
