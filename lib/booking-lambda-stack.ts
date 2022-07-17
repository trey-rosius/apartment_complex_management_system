import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnFunctionConfiguration,
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
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Tracing } from "aws-cdk-lib/aws-lambda";
import { aws_iam } from "aws-cdk-lib";
import { readFileSync } from "fs";

interface BookingLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
  acmsTableDatasource: CfnDataSource;
}

export class BookingLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: BookingLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema, acmsTableDatasource } =
      props;

    const deadLetterQueue = new sqs.Queue(this, "DeadLetterQueue");

    // The code that defines your stack goes here
    const policyStatement = new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: ["cloudwatch:PutMetricData"],
      resources: ["*"],
    });

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
     * booking function
     */
    const bookingLambda: NodejsFunction = new NodejsFunction(
      this,
      "AcmsBookingHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "lambda-fns/booking", "app.ts"),
        initialPolicy: [policyStatement],

        memorySize: 1024,
      }
    );

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

    const getBookingPerApartmentResolver: CfnResolver = new CfnResolver(
      this,
      "getBookingPerApartmentResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getBookings",
        dataSourceName: lambdaDataSources.attrName,
      }
    );

    const getAllBookingsByApartmentFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getAllBookingsFunction", {
        apiId: acmsGraphqlApi.attrApiId,

        dataSourceName: acmsTableDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_all_bookings_per_apartment_request.vtl"
        ).toString(),
        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_all_bookings_per_apartment_response.vtl"
        ).toString(),
        functionVersion: "2018-05-29",
        name: "getAllBookingsFunction",
      });

    const getUserPerBookingsFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getUserPerBookingFunction", {
        apiId: acmsGraphqlApi.attrApiId,

        dataSourceName: acmsTableDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_user_per_booking_request.vtl"
        ).toString(),
        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/get_user_per_booking_response.vtl"
        ).toString(),
        functionVersion: "2018-05-29",
        name: "getUserPerBookingFunction",
      });

    const getResultBookingPerApartmentResolver: CfnResolver = new CfnResolver(
      this,
      "getResultBookingPerApartmentResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllBookingsPerApartment",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            getAllBookingsByApartmentFunction.attrFunctionId,
            getUserPerBookingsFunction.attrFunctionId,
          ],
        },

        requestMappingTemplate: readFileSync(
          "./lib/vtl_templates/before_mapping_template.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl_templates/after_mapping_template.vtl"
        ).toString(),
      }
    );

    createApartmentBookingResolver.addDependsOn(apiSchema);
    getResultBookingPerApartmentResolver.addDependsOn(apiSchema);
    getBookingPerApartmentResolver.addDependsOn(apiSchema);
    acmsDatabase.grantFullAccess(bookingLambda);
    bookingLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
  }
}
