import { Logger } from "@aws-lambda-powertools/logger";
import createUserAccount from "./createUserAccounts";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    input: UserInput;
  };
};

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
  userType: string;
};

exports.handler = async (event: AppSyncEvent, context: any) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createUserAccount":
      return await createUserAccount(event.arguments.input, logger);

    default:
      return null;
  }
};
