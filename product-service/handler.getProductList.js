import { APIGatewayProxyHandler } from 'aws-lambda';

export const getProductsList: APIGatewayProxyHandler = async (event, _context) => {
  try {
    // Your logic to fetch the products list goes here
    const products = ['Product1', 'Product2', 'Product3'];

    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
