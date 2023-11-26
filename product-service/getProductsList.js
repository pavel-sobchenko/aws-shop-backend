const { products } = require('./assets/products');

module.exports.handler = async (event) => {
  try {
    return {
      statusCode: 200,
      body: products,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
