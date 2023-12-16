const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const csvParser = require("csv-parser");

exports.handler = async (event) => {
    const s3 = new S3Client();
    const sqsClient = new SQSClient();

    const bucketName = event['Records'][0]['s3']['bucket']['name'];
    const objectName = event['Records'][0]['s3']['object']['key'];

    console.log('bucket:', bucketName);
    console.log('key:', objectName);

    try {
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectName,
        });

        const s3Object = await s3.send(getObjectCommand);

        const records = s3Object.Body.pipe(csvParser());

        const recordArray = [];
        for await (const record of records) {
            recordArray.push(record);
        }

        await sqsClient.send(new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(recordArray),
        }));

        const newObjectKey = `parsed/${objectName.split('/').pop()}`;
        await s3.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${objectName}`,
            Key: newObjectKey
        }));

        console.log('Copied file:', newObjectKey);

        await s3.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectName
        }));

        console.log('Deleted file:', objectName);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS, GET, PUT',
            },
            body: JSON.stringify({ message: 'CSV File was processed' }),
        }
    } catch (error) {
        console.error('Error processing CSV file:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
