import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import * as signer from "aws-cdk-lib/aws-signer";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Tracing } from "aws-cdk-lib/aws-lambda";

interface BookingLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
}

export class BookingLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: BookingLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema } = props;
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

    const bookingLambda = new NodejsFunction(this, "AcmsBookingHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "lambda-fns/booking", "app.ts"),

      memorySize: 1024,
    });
    bookingLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });
    appsyncLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "ACMSBookingLambdaDatasource",
      {
        apiId: acmsGraphqlApi.attrApiId,
        name: "ACMSBookingLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: bookingLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const createApartmentBookingResolver: CfnResolver = new CfnResolver(
      this,
      "createApartmentBookingResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createApartmentBooking",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    createApartmentBookingResolver.addDependsOn(apiSchema);
    acmsDatabase.grantFullAccess(bookingLambda);
    bookingLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
  }
}
