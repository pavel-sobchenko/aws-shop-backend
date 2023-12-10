const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { TransactWriteCommand } =  require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
    const product = event?.Records[0]?.body;
    console.log('!!!!product:', product);

    const dynamoDBClient = new DynamoDBClient();
    const id = `${crypto.randomUUID()}`;

    const productItemRaw = (Object.entries(JSON.parse(product)).map(([key, value]) => {
        if (key === 'Count') {
            return [key.toLowerCase(), Number(value)];
        }
        return [key.toLowerCase(), value]
    }));

    const productItem = {
        id,
        title: productItemRaw.title,
        description: productItemRaw.description,
        price: productItemRaw.price,
    };

    console.log('productItem:', productItem);

    const stock = {
        product_id: id,
        count: productItemRaw.count || 0
    };

    console.log('stock:', stock);

    try {

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
