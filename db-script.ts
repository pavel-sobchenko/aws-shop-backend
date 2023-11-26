import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

const awsProfile = 'admin';
const credentials = new AWS.SharedIniFileCredentials({ profile: awsProfile });
AWS.config.credentials = credentials;

AWS.config.update({ region: 'eu-west-1'});

const dynamoDb = new AWS.DynamoDB();
const productsTableName = 'Products';
const stocksTableName = 'Stocks';

// Function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
    try {
      await dynamoDb.describeTable({ TableName: tableName }).promise();
      return true;
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  }
  
  // Function to create tables
  async function createTable(params: AWS.DynamoDB.CreateTableInput): Promise<void> {
    if (await tableExists(params.TableName)) {
      console.log(`Table ${params.TableName} already exists.`);
      return;
    }
  
    try {
      await dynamoDb.createTable(params).promise();
      console.log(`Table ${params.TableName} created successfully.`);
    } catch (error) {
      console.error(`Error creating table ${params.TableName}: ${error.message}`);
    }
  }

createTable({
    TableName: productsTableName,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],  
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
    }
});

createTable({
    TableName: stocksTableName,
    KeySchema: [
      { AttributeName: 'product_id', KeyType: 'HASH' },
    ],  
    AttributeDefinitions: [
      { AttributeName: 'product_id', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
    }
});

async function insertData(params: AWS.DynamoDB.PutItemInput) {
  try {
    await dynamoDb.putItem(params).promise();
    console.log(`Item inserted into table ${params.TableName}`);
  } catch (error) {
    console.error(`Error inserting item into table ${params.TableName}`, error);
  }
}

const productsData: AWS.DynamoDB.PutItemInput[] = [
    {
      TableName: productsTableName,
      Item: {
        id: { S: uuid.v4() },
        title: { S: 'Whiskey' },
        description: { S: 'A fine alcoholic beverage' },
        price: { N: '50' },
      },
    },
    {
      TableName: productsTableName,
      Item: {
        id: { S: uuid.v4() },
        title: { S: 'Vodka' },
        description: { S: 'A clear distilled alcoholic beverage' },
        price: { N: '30' },
      },
    },
  ];

  const stocksData: AWS.DynamoDB.PutItemInput[] = [
    {
      TableName: stocksTableName,
      Item: {
        product_id: { S: productsData[0].Item.id.S },
        count: { N: '100' },
      },
    },
    {
      TableName: stocksTableName,
      Item: {
        product_id: { S: productsData[1].Item.id.S },
        count: { N: '150' },
      },
    },
  ];

  for (const data of [...productsData, ...stocksData]) {
    insertData(data);
  }