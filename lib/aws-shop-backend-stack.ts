import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
      functionName: 'GetProductsListLambda',
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'productList.handler',
      environment: {
        PRODUCTS_TABLE: 'Products',
        STOCK_TABLE: 'Stocks',
      }
    });

    getProductsListLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Scan'],
      // resources: ['arn:aws:dynamodb:eu-west-1:123456789012:table/Products'],
      resources: ['*'],
    }));

    const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
      functionName: 'GetProductsByIdLambda',
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'getProductById.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        PRODUCTS_TABLE: 'Products',
        STOCK_TABLE: 'Stocks',
      }
    });

    getProductsByIdLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
      // resources: ['arn:aws:dynamodb:eu-west-1:123456789012:table/Products'],
      resources: ['*']
    }));

    const api = new apigateway.RestApi(this, 'aws-shop-api', {
      restApiName: 'aws-shop-api',
      description: 'This is my first API Gateway service',
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));

    const productIdResource = productsResource.addResource('{id}');
    productIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
  }
}
