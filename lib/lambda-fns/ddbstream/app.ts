import { DynamoDBStreamEvent, Context } from "aws-lambda";
exports.handler = async (event: DynamoDBStreamEvent, context: Context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
};
