const { DynamoDB } = require('aws-sdk');

exports.handler = async (event) => {
    const dynamoDB = new DynamoDB.DocumentClient();
    const productsTableName = process.env.PRODUCTS_TABLE;
    const stockTableName = process.env.STOCK_TABLE;

    const productsParams = { TableName: productsTableName };
    const stockParams = { TableName: stockTableName };


    try {
        const productsResults = await dynamoDB.scan(productsParams).promise();
        console.log('productResults:', productsResults);
        const products = productsResults.Items;

        const stockResults = await dynamoDB.scan(stockParams).promise();
        console.log('stockResults:', stockResults);
        const stock = stockResults.Items;

        const combinedResults = products.map((product) => {
            const stockItem = stock.find((s) => s.product_id === product.id);
            return {
                ...product,
                count: stockItem?.count || 0,
            };
        });
        console.log('combinedResults:', combinedResults);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS, GET',
              },
            body: JSON.stringify(combinedResults),
        };
        } catch (error) {
            console.error('Error scanning DynamoDB table:', error);
        
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal Server Error' }),
            };
        }
  };
  