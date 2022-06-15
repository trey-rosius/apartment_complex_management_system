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

exports.handler = async (
  event: AppSyncEvent,
  context: any
): Promise<UserInput | null> => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createUserAccount":
      return await createUserAccount(event.arguments.input);
    case "createNote":
    // return await createNote(event.arguments.note);
    case "listNotes":
    //  return await listNotes();
    case "deleteNote":
    //  return await deleteNote(event.arguments.noteId);
    case "updateNote":
    //  return await updateNote(event.arguments.note);
    default:
      return null;
  }
};
