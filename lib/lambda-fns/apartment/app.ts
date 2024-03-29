import { Logger } from "@aws-lambda-powertools/logger";
import createApartment from "./createApartment";
import { AppSyncResolverEvent, Context } from "aws-lambda";

import CreateApartmentInput from "./CreateApartmentInput";
const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

exports.handler = async (
  event: AppSyncResolverEvent<CreateApartmentInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${JSON.stringify(
      event.arguments.input
    )} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartment":
      return await createApartment(event.arguments, logger);

    default:
      return null;
  }
};
