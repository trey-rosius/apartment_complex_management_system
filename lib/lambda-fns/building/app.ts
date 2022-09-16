import { Logger } from "@aws-lambda-powertools/logger";
import createBuilding from "./createBuilding";
import { AppSyncResolverEvent, Context } from "aws-lambda";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

exports.handler = async (
  event: AppSyncResolverEvent<CreateBuildingInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${JSON.stringify(
      event.arguments.input
    )} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createBuilding":
      return await createBuilding(event.arguments, logger);

    default:
      return null;
  }
};
