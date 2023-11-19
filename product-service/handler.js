'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: {
      productName: 'Rum Black Spicy',
      price: 100
    },
  };
};
