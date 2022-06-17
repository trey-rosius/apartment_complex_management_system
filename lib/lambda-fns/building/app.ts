import { Logger } from "@aws-lambda-powertools/logger";
import createBuilding from "./createBuilding";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    input: {};
  };
};

exports.handler = async (event: AppSyncEvent, context: any) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createBuilding":
      return await createBuilding(logger);

    default:
      return null;
  }
};
