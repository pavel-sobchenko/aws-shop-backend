import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import 'dotenv/config';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket = s3.Bucket.fromBucketName(this, 'S3Bucket', 'rs-aws-be-sobchanka');
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
        queueName: 'CatalogItemsQueue',
        visibilityTimeout: cdk.Duration.seconds(300),
    });
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
        displayName: 'CreateProductTopic',
    });

    createProductTopic.addSubscription(new sns_subscriptions.EmailSubscription('sobchanka@tut.by'));

    const productTable = dynamodb.Table.fromTableName(this, 'Products', 'Products');

    const stockTable = dynamodb.Table.fromTableName(this, 'Stocks','Stocks');

    /***Product service lambda functions*******/
    const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
      functionName: 'GetProductsListLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('product-service/lambda'),
      handler: 'productList.handler',
      environment: {
        PRODUCTS_TABLE: 'Products',
        STOCK_TABLE: 'Stocks',
      }
    });

    getProductsListLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Scan'],
      resources: ['*'],
    }));

    const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
      functionName: 'GetProductsByIdLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductById.handler',
      code: lambda.Code.fromAsset('product-service/lambda'),
      environment: {
        PRODUCTS_TABLE: 'Products',
        STOCK_TABLE: 'Stocks',
      }
    });

    getProductsByIdLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:GetItem'],
      resources: ['*']
    }));

    const createProductLambda = new lambda.Function(this, 'CreateProductLambda', {
      functionName: 'CreateProductLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'createProduct.handler',
      code: lambda.Code.fromAsset('product-service/lambda'),
      environment: {
        PRODUCTS_TABLE: 'Products',
      }
    });

    createProductLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: ['*']
    }));

    const catalogBatchProcessLambda = new lambda.Function(this, 'CatalogBatchProcessLambda', {
        functionName: 'CatalogBatchProcessLambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'catalogBatchProcess.handler',
        code: lambda.Code.fromAsset('product-service/lambda'),
        environment: {
           QUEUE_URL: catalogItemsQueue.queueUrl,
           PRODUCTS_TABLE: 'Products',
           STOCK_TABLE: 'Stocks',
           CREATE_PRODUCT_SNS_TOPIC_ARN: createProductTopic.topicArn
        }
    });

    catalogBatchProcessLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: ['*']
    }));

    catalogItemsQueue.grantSendMessages(catalogBatchProcessLambda);
    productTable.grantReadWriteData(catalogBatchProcessLambda);
    stockTable.grantReadWriteData(catalogBatchProcessLambda);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEventSource(
        new events_sources.SqsEventSource(catalogItemsQueue, {
          batchSize: 5,
        })
    );

    createProductTopic.grantPublish(catalogBatchProcessLambda);

    /***End of product service lambda functions*******/

    /***Import service lambda functions*******/

    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
        functionName: 'ImportProductsFileLambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'importProductsFile.handler',
        code: lambda.Code.fromAsset('import-service/lambda'),
        environment: {
          S3_BUCKET_NAME: s3Bucket.bucketName
        }
    });
    s3Bucket.grantWrite(importProductsFileLambda);

    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
        functionName: 'ImportFileParserLambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'importFileParser.handler',
        code: lambda.Code.fromAsset('import-service/lambda'),
        environment: {
            QUEUE_URL: catalogItemsQueue.queueUrl,
        }
    });
    catalogItemsQueue.grantSendMessages(importFileParserLambda);

    s3Bucket.grantRead(importFileParserLambda);
    s3Bucket.grantDelete(importFileParserLambda);

    s3Bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(importFileParserLambda),
        {
          prefix: 'uploaded/'
        });
    new cdk.CfnOutput(this, 'S3BucketName', { value: s3Bucket.bucketName });
    new cdk.CfnOutput(this, 'SQSQueueURL', { value: catalogItemsQueue.queueUrl });
    new cdk.CfnOutput(this, 'CatalogItemsQueueArn', {
        value: createProductTopic.topicArn,
    });
    new cdk.CfnOutput(this, 'ProductTableName', { value: productTable.tableName });
    new cdk.CfnOutput(this, 'StockTableName', { value: stockTable.tableName });

    /***End of import service lambda functions*******/

    /***Autorization service lambda functions*******/

    const basicAuthorizerLambda = new lambda.Function(this, 'BasicAuthorizerLambda', {
        functionName: 'BasicAuthorizerLambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'basicAuthorizer.handler',
        code: lambda.Code.fromAsset('authorization-service/lambda'),
        environment: {
            LOGIN_PASSWORD: 'pavel-sobchenko=TEST_PASSWORD',
            // LOGIN_PASSWORD: process.env.LOGIN=process.env.TEST_PASSWORD,
        }
    });

    // const authorizer = new apigateway.TokenAuthorizer(this, 'BasicAuthorizer', {
    //     handler: basicAuthorizerLambda,
    //     identitySource: 'method.request.header.Authorization',
    // });

    /***End of autorization service lambda functions*******/

    const api = new apigateway.RestApi(this, 'aws-shop-api', {
      restApiName: 'aws-shop-api',
      description: 'This is my first API Gateway service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      }
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    const productIdResource = productsResource.addResource('{id}');
    productIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));

    const importResource = api.root.addResource('import',
        // {
        //     defaultMethodOptions: {
        //         authorizer
        //     }
        // }
        );
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda));

    importProductsFileLambda.addPermission('ApiGatewayInvokePermission',{
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // const secureEndpoint = api.root.addResource('secure');
    // secureEndpoint.addMethod('GET', new apigateway.HttpIntegration('http:/localhost:3000'), {
    //     authorizationType: apigateway.AuthorizationType.CUSTOM,
    //     authorizer: {
    //         authorizerId: authorizer.authorizerId,
    //     }
    // });

    const emailSubscriptionWithFilterPolicy = new sns_subscriptions.EmailSubscription(
      'email@example.com',
      {
          filterPolicy: {
              attributes: sns.SubscriptionFilter.stringFilter({
                  allowlist: ['price']
              })
          }
      }
    );

    createProductTopic.addSubscription(emailSubscriptionWithFilterPolicy);

  }
}
