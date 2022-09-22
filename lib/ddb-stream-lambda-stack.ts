import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import * as signer from "aws-cdk-lib/aws-signer";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Tracing } from "aws-cdk-lib/aws-lambda";

import {
  DynamoEventSource,
  SqsDlq,
} from "aws-cdk-lib/aws-lambda-event-sources";

interface DdbStreamLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
}

export class DdbStreamLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: DdbStreamLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema } = props;

    const deadLetterQueue = new sqs.Queue(this, "DeadLetterQueueDDB");

    const signingProfile = new signer.SigningProfile(this, "SigningProfile", {
      platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new lambda.CodeSigningConfig(
      this,
      "CodeSigningConfig",
      {
        signingProfiles: [signingProfile],
      }
    );

    /**
     * read dynamodb stream
     *
     */

    const readDDBStreamLambda: NodejsFunction = new NodejsFunction(
      this,
      "ReadDDBStreamHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "lambda-fns/ddbstream", "app.ts"),

        memorySize: 1024,
      }
    );

    //add dynamodb stream event source
    readDDBStreamLambda.addEventSource(
      new DynamoEventSource(acmsDatabase, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        bisectBatchOnError: true,
        onFailure: new SqsDlq(deadLetterQueue),
        retryAttempts: 10,
      })
    );

    readDDBStreamLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    acmsDatabase.grantFullAccess(readDDBStreamLambda);
    readDDBStreamLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
  }
}
