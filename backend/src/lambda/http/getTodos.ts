import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger("get-todos");

const getTodosHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('processing event ' + JSON.stringify(event));
  const userId = getUserId(event);
  const todos = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
  }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify({items: todos.Items}),
  }
}

export const handler = middy(getTodosHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
