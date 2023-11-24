import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
      functionName: 'GetProductsListLambda',
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'productList.handler',
    });

    const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
      functionName: 'GetProductsByIdLambda',
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'getProductById.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

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
