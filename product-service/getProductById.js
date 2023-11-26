const { products } = require('./assets/products');
module.exports.handler = async (event) => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is missing' }),
      };
    }

    const product = products.find(({ id }) => id === Number(productId));

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      body: product,
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
