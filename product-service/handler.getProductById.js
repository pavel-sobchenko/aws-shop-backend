import { APIGatewayProxyHandler } from 'aws-lambda';

export const getProductsById: APIGatewayProxyHandler = async (event, _context) => {
  try {
    // Your logic to fetch product by ID goes here
    const productId = event.pathParameters?.id;
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is missing' }),
      };
    }

    // Fetch product details using the productId

    const product = {
      id: productId,
      name: 'Sample Product',
      price: 19.99,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
