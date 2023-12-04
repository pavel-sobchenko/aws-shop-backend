const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const csvParser = require("csv-parser");


exports.handler = async (event) => {
    const s3 = new S3Client();

    const bucketName = event['Records'][0]['s3']['bucket']['name'];
    const objectName = event['Records'][0]['s3']['object']['key'];

    console.log('bucket:', bucketName);
    console.log('key:', objectName);

    try {
        const s3Object = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectName }));
        const csvData = await streamToString(s3Object.Body);

        const results = [];
        csvParser({ headers: true })
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(results);
            })
            .write(csvData);

        return {
            statusCode: 200,
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

const streamToString = async (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (error) => reject(error));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
};
