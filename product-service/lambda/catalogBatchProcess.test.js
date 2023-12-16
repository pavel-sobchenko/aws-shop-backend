const { handler } = require('./handler');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const { mocked } = require('ts-jest/utils');

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('Lambda Handler', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should handle the Lambda function with successful transaction', async () => {
        const mockSend = jest.fn().mockReturnValueOnce(Promise.resolve({}));

        mocked(DynamoDBClient.prototype.send).mockImplementation(mockSend);

        const event = {
            Records: [
                {
                    body: JSON.stringify([
                        { id: '1', name: 'Product 1', count: 10 },
                        { id: '2', name: 'Product 2', count: 20 },
                    ]),
                },
            ],
        };

        const result = await handler(event);

        expect(mockSend).toHaveBeenCalledWith(
            new TransactWriteCommand({
                TransactItems: expect.any(Array),
            })
        );

        expect(result.statusCode).toBe(201);
        expect(result.body).toContain('Product created');
    });

    it('should handle the Lambda function with a failed transaction', async () => {
        const mockSend = jest.fn().mockImplementation(() => {
            throw { name: 'TransactionCanceledException' };
        });

        mocked(DynamoDBClient.prototype.send).mockImplementation(mockSend);

        const event = {
            Records: [
                {
                    body: JSON.stringify([{ id: '1', name: 'Product 1', count: 10 }]),
                },
            ],
        };

        const result = await handler(event);

        expect(mockSend).toHaveBeenCalledWith(
            new TransactWriteCommand({
                TransactItems: expect.any(Array),
            })
        );

        expect(result.statusCode).toBe(500);
        expect(result.body).toContain('Transaction failed');
    });

    it('should handle the Lambda function with an internal server error', async () => {
        const mockSend = jest.fn().mockImplementation(() => {
            throw new Error('Some unexpected error');
        });

        mocked(DynamoDBClient.prototype.send).mockImplementation(mockSend);

        const event = {
            Records: [
                {
                    body: JSON.stringify([{ id: '1', name: 'Product 1', count: 10 }]),
                },
            ],
        };

        const result = await handler(event);

        expect(mockSend).toHaveBeenCalledWith(
            new TransactWriteCommand({
                TransactItems: expect.any(Array),
            })
        );

        expect(result.statusCode).toBe(500);
        expect(result.body).toContain('Internal Server Error');
    });
});
