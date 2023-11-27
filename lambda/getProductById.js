const { DynamoDB } = require('aws-sdk');

exports.handler = async (event) => {
  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is missing' }),
      };
    }

    const dynamoDB = new DynamoDB.DocumentClient();
    const productsTableName = process.env.PRODUCTS_TABLE;
    const stockTableName = process.env.STOCK_TABLE;

    const productsParams = { 
        TableName: productsTableName, 
        KeyConditionExpression: 'id = :idVal',
        ExpressionAttributeValues: {
          ':idVal': productId,
        },
    };
    const stockParams = { 
        TableName: stockTableName, 
        Key: { product_id: productId } 
    };

    const productsResults = await dynamoDB.query(productsParams).promise();
    console.log('ProductResults:', productsResults);
    const productItem = productsResults.Items[0];

    const stockResults = await dynamoDB.get(stockParams).promise();
    console.log('stockResults:', stockResults);
    const stock = stockResults.Item;

    if (!productItem) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...productItem,
        count: stock?.count || 0,  
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
