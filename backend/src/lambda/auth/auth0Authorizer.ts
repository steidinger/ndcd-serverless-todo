import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import * as jwkToPem from 'jwk-to-pem';
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const authHandler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function getPublicKey(kid: string): Promise<string> {
  const jwksUrl = process.env.AUTH_0_JWKS_URL;
  logger.debug(`Retrieving JWKS from ${jwksUrl}`);
  const response = await Axios.get(jwksUrl);
  logger.debug('response for JWKS: ', response.data);
  if (response.status === 200 && response.data.keys) {
      const key = response.data.keys.find(key => key.kid === kid);
      logger.debug('Found key: ' + key);
      const pem = jwkToPem(key);
      logger.debug('converted key to pem:' + pem);
      return pem;
  }
  console.error('could not retrieve jwks: ', response);
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  if (jwt.header.kid) {
    const key = await getPublicKey(jwt.header.kid);
    return verify(token, key) as JwtPayload;
  }
  return undefined
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

export const handler = middy(authHandler);

handler.use(cors({
  origin: "http://localhost:3000"
}));

