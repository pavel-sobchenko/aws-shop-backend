const AWSMock = require('aws-sdk-mock');
const lambdaHandler = require('./importProductsFile');

describe('importProductsFile', () => {
    afterEach(() => {
        AWSMock.restore();
    });

    it('should return signed url for a put request', async () => {
        AWSMock.mock('S3', 'putObject', {});

        const event = {
            queryStringParameters: {
                name: 'test.csv'
            }
        };

        const result = await lambdaHandler.handler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toContain('signedUrl');
    });

    it('should return 400 code for empty object', async () => {
        AWSMock.mock('S3', 'putObject', {});

        const event = {
            queryStringParameters: {}
        };

        const result = await lambdaHandler.handler(event);

        expect(result.statusCode).toEqual(400);
    });

    it('should handle errors during S3 putObject operation', async () => {
        AWSMock.mock('S3', 'putObject', (params, callback) => {
            callback(new Error('Mocked S3 error'));
        });

        const event = null;
        const result = await lambdaHandler.handler(event);

        expect(result.statusCode).toBe(500);
    });
});
