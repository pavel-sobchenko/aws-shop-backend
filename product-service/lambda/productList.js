const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    const productsParams = { TableName: process.env.PRODUCTS_TABLE };
    const stockParams = { TableName: process.env.STOCK_TABLE };

    try {
        const productScan = new ScanCommand(productsParams);
        const productItems = (await client.send(productScan)).Items
            .map(item => unmarshall(item));
        console.log('productResults:', productItems);

        const stockScan = new ScanCommand(stockParams);
        const stockItems = (await client.send(stockScan)).Items
            .map(item => unmarshall(item));
        console.log('stockResults:', stockItems);

        const combinedResults = productItems.map((product) => {
            const stockItem = stockItems.find((s) => s.product_id === product.id);
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
