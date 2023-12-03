import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket = s3.Bucket.fromBucketName(this, 'S3Bucket', 'rs-aws-be-sobchanka');

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

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda));

    importProductsFileLambda.addPermission('ApiGatewayInvokePermission',{
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

  }
}
