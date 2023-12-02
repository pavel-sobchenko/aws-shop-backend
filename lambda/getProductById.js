const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClent = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    console.log(`getProduct lambda invoked with event: ${JSON.stringify(event)}`);
    const productId = event.pathParameters?.id;
    console.log('productId:', productId);

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is missing' }),
      };
    }

    const product = (await docClent.send(new GetCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: productId },
    }))).Item;

    console.log('products:', product);

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const stocks = (await docClent.send(new GetCommand({
      TableName: process.env.STOCK_TABLE,
      Key: { product_id: productId },
    }))).Item;

    console.log('stocks:', stocks);

    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
          'Access-Control-Allow-Methods': 'OPTIONS, GET',
        },  
        body: JSON.stringify({
          ...product,
          count: stocks?.count || 0,
        })
      };

  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};