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
      actions: ['dynamodb:Query', 'dynamodb:GetItem'],
      resources: ['*']
    }));

    const createProductLambda = new lambda.Function(this, 'CreateProductLambda', {
      functionName: 'CreateProductLambda',
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'createProduct.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        PRODUCTS_TABLE: 'Products',
      }
    });

    createProductLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: ['*']
    }));

    const api = new apigateway.RestApi(this, 'aws-shop-api', {
      restApiName: 'aws-shop-api',
      description: 'This is my first API Gateway service',
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    const productIdResource = productsResource.addResource('{id}');
    productIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
  }
}
