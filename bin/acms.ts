#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AcmsStack } from "../lib/acms-stack";
import { UserLamdaStacks } from "../lib/user-lambda-stack";
import { BuildingLamdaStacks } from "../lib/building-lambda-stack";
import { ApartmentLamdaStacks } from "../lib/apartment-lambda-stack";
import { BookingLamdaStacks } from "../lib/booking-lambda-stack";
import { DdbStreamLamdaStacks } from "../lib/ddb-stream-lambda-stack";

const app = new cdk.App();
const acmsStack = new AcmsStack(app, "AcmsStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: "132260253285", region: "us-east-2" },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});

new BuildingLamdaStacks(app, "BuildingLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});

new ApartmentLamdaStacks(app, "ApartmentLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});

new BookingLamdaStacks(app, "BookingLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});

new DdbStreamLamdaStacks(app, "DdbStreamLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
});
