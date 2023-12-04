const { handler } = require('./importFileParser');
const awsMock = require('aws-sdk-mock');
const csvParser = require('csv-parser');

describe('Lambda Function Tests', () => {
    afterEach(() => {
        awsMock.restore();
    });

    it('should process CSV file successfully', async () => {
        const mockS3Client = {
            send: jest.fn().mockResolvedValue({
                Body: {
                    on: jest.fn(),
                },
            }),
        };

        const mockGetObjectCommand = {
            promise: jest.fn().mockResolvedValue({
                Body: {
                    on: jest.fn(),
                },
            }),
        };

        const mockCsvParser = {
            on: jest.fn(),
            write: jest.fn(),
        };

        awsMock.mock('S3', 'S3', mockS3Client);
        awsMock.mock('S3', 'GetObjectCommand', mockGetObjectCommand);
        jest.spyOn(csvParser, 'default').mockImplementation(() => mockCsvParser);

        const event = {
            Records: [
                {
                    s3: {
                        object: {
                            key: 'uploaded/test.csv',
                        },
                    },
                },
            ],
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(result.body).toBe('CSV file processed successfully');
    });

    it('should handle errors during CSV file processing', async () => {
        awsMock.mock('S3', 'S3', () => ({
            send: jest.fn().mockRejectedValue(new Error('S3 Error')),
        }));

        const event = {
            Records: [
                {
                    s3: {
                        object: {
                            key: 'uploaded/test.csv',
                        },
                    },
                },
            ],
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        expect(result.body).toBe('Internal Server Error');
    });
});
