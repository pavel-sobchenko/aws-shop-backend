const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { TransactWriteCommand } =  require("@aws-sdk/lib-dynamodb");


exports.handler = async (event) => {
    console.log('event:', event);
    const products = event?.Records[0]?.body;
    console.log('product:', products);

    const dynamoDBClient = new DynamoDBClient();

    const productItems = convertArray(JSON.parse(products));
    console.log('productItem:', productItems);

    const stockItems = productItems.map((item) => {
        return {
            product_id: item.id,
            count: item.count || 0
        };
    });

    console.log('stock:', stockItems);

    try {
        const transactItems = [];

        productItems.forEach((productItem) => {
            transactItems.push({
                Put: {
                    TableName: 'Products',
                    Item: productItem,
                },
            });
        });

        stockItems.forEach((stockItem) => {
            transactItems.push({
                Put: {
                    TableName: 'Stocks',
                    Item: stockItem,
                },
            });
        });

        const result = await dynamoDBClient.send(
            new TransactWriteCommand({
                TransactItems: transactItems,
            })
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


const convertArray = (inputArray) => {
    return inputArray.map((obj, index) => {
        const id = `${crypto.randomUUID()}`;
        const newObj = { id, ...obj };
        return Object.fromEntries(Object.entries(newObj).map(([key, value]) => [key.toLowerCase(), value]));
    });
};
