const dotenv = require('dotenv');

exports.handler = async (event, context) => {
    console.log('!@# Basic Authorizer event: ', event);
    try {
        const authorizationToken = event.headers.Authorization;
        if (!authorizationToken) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Authorization header is missing' }),
            };
        }
        const [type, credentials] = authorizationToken.split(' ');

        if (type !== 'Basic' || !credentials) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Invalid authorization type or missing credentials' }),
            };
        }

        const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
        const [username, password] = decodedCredentials.split(':');
        console.log('username: ', username);
        console.log('password: ', password);
        const expectedPassword = process.env.PASSWORD;
        console.log('expectedPassword: ', expectedPassword);
        //
        if (expectedPassword === password) {
            const policy = generatePolicy('user', 'Allow', event.methodArn);
            console.log('!!!!!!!', policy);
            return policy;
        } else {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Access denied' }),
            };
        }
    } catch (error) {
        console.log('Error: ', error);
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Access denied END!!!' }),
        };
    }
}

const generatePolicy = (principalId, effect, resource) => {
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            },
        ],
    };

    return {
        principalId,
        policyDocument,
    };
};

