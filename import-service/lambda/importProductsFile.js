const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const  { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        const fileName = event.queryStringParameters.name;
        console.log('fileName:', fileName);

        if (!fileName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Filename is missing in the query parameters.' }),
            };
        }

        const s3Params = {
            Bucket: 'rs-aws-be-sobchanka',
            Key: `uploaded/${fileName}`,
        };

        const command = new PutObjectCommand(s3Params);
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS, GET',
            },
            body: JSON.stringify({ signedUrl }),
        };
    } catch (error) {
        console.error('Error scanning DynamoDB table:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
