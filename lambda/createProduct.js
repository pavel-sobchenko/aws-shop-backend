const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { TransactWriteCommand } =  require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
    const dynamoDBClient = new DynamoDBClient();
    const productsTableName = process.env.PRODUCTS_TABLE;
    const stockTableName = process.env.STOCK_TABLE;

    console.log('eventBody:', event.body);

    try {
        const requestBody = JSON.parse(event.body);

        console.log('requestBody:', requestBody);

        if (!requestBody.title || !requestBody.description || !requestBody.price) {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: 'Missing required fields' }),
            };
          }

        const id = `${crypto.randomUUID()}`;

        const product = {
            id: id,
            title: requestBody.title,
            description: requestBody.description,
            price: requestBody.price,
            count: requestBody.count || 0
        };

        console.log('product:', product);

        const stock = {
            product_id: id,
            count: requestBody.count || 0
        };

        console.log('stock:', stock);

        const result = await dynamoDBClient.send(
            new TransactWriteCommand({
              TransactItems: [
                {
                  Put: {
                    TableName: 'Products',
                    Item: product
                  },
                },
                {
                  Put: {
                    TableName: 'Stocks',
                    Item: stock
                  },
                },
              ],
            }),
          );

        console.log('Transaction result:', result);

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Product created' }),
        };
    } catch (error) {    
        console.error('Error creating product in DynamoDB table:', error);

        if (error.name === 'TransactionCanceledException') {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Transaction failed' }),
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};