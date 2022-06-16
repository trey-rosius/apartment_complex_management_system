import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";

async function createBuilding(building: UserInput, logger: Logger) {
  console.log("in here");
  return null;
}

export default createBuilding;
