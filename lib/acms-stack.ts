import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { readFileSync } from "fs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AcmsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * UserPool and UserPool Client
     */
    const userPool: UserPool = new cognito.UserPool(
      this,
      "ACMSCognitoUserPool",
      {
        selfSignUpEnabled: true,
        accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
        userVerification: {
          emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
      }
    );

    const userPoolClient: UserPoolClient = new cognito.UserPoolClient(
      this,
      "ACMSUserPoolClient",
      {
        userPool,
      }
    );

    /**
     * CloudWatch Role
     */
    // give appsync permission to log to cloudwatch by assigning a role

    const cloudWatchRole = new iam.Role(this, "appSyncCloudWatchLogs", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    cloudWatchRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    /**
     * GraphQL API
     */
    const acmsGraphqlApi: CfnGraphQLApi = new CfnGraphQLApi(
      this,
      "acmsGraphqlApi",
      {
        name: "ACMS",
        authenticationType: "API_KEY",

        additionalAuthenticationProviders: [
          {
            authenticationType: "AMAZON_COGNITO_USER_POOLS",

            userPoolConfig: {
              userPoolId: userPool.userPoolId,
              awsRegion: "us-east-2",
            },
          },
        ],
        userPoolConfig: {
          userPoolId: userPool.userPoolId,
          defaultAction: "ALLOW",
          awsRegion: "us-east-2",
        },

        logConfig: {
          fieldLogLevel: "ALL",
          cloudWatchLogsRoleArn: cloudWatchRole.roleArn,
        },
        xrayEnabled: true,
      }
    );

    /**
     * Graphql Schema
     */

    const apiSchema: CfnGraphQLSchema = new CfnGraphQLSchema(
      this,
      "ACMSGraphqlApiSchema",
      {
        apiId: acmsGraphqlApi.attrApiId,
        definition: readFileSync("./schema/schema.graphql").toString(),
      }
    );

    /**
     * Database
     */

    const acmsDatabase = new Table(this, "ACMSDynamoDbTable", {
      tableName: "AcmsDynamoDBTable",

      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,

      removalPolicy: RemovalPolicy.DESTROY,
    });

    acmsDatabase.addGlobalSecondaryIndex({
      indexName: "bookingsPerApartment",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    /**
     * Outputs
     */

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "GraphQLAPI ID", {
      value: acmsGraphqlApi.attrApiId,
    });

    new CfnOutput(this, "GraphQLAPI URL", {
      value: acmsGraphqlApi.attrGraphQlUrl,
    });
  }
}
