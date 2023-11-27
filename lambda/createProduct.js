const { DynamoDB } = require('aws-sdk');

exports.handler = async (event) => {
    const dynamoDB = new DynamoDB.DocumentClient();
    const productsTableName = process.env.PRODUCTS_TABLE;

    console.log('eventBody:', event.body);

    try {
        const requestBody = JSON.parse(event.body);

        console.log('requestBody:', requestBody);

        if (!requestBody.id || !requestBody.title || !requestBody.description || !requestBody.price) {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: 'Missing required fields' }),
            };
          }

        const productsParams = {
            TableName: productsTableName,
            Item: {
                id: requestBody.id,
                title: requestBody.title,
                description: requestBody.description,
                price: requestBody.price,
            },
        };  

        await dynamoDB.put(productsParams).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Product created' }),
        };
    } catch (error) {    
        console.error('Error creating product in DynamoDB table:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};