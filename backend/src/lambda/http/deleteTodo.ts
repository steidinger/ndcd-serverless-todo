import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX;
const logger = createLogger("delete-todo");

export const deleteTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`Processing delete event for ID ${todoId}`);
  const userId = getUserId(event);
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: todosIdIndex,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId
    }
  }).promise();

  if (result.Count === 0) {
    logger.info(`todo with ID ${todoId} not found`);
    return {
      statusCode: 404,
      body: ''
    }
  }
  const todo = result.Items[0];
  if (todo.userId !== userId) {
    logger.info(`user ${userId} is not allowed to delete todo created by ${todo.userId}`);
    return {
      statusCode: 403,
      body: '',
    }
  }
  logger.info(`deleting todo with ID ${todoId}, userId ${todo.userId}, createdAt ${todo.createdAt}`);

  await docClient.delete({
    TableName: todosTable,
    Key: {
      userId: todo.userId,
      createdAt: todo.createdAt,
    }
  }).promise();
  logger.info('deleted todo');

  return {
    statusCode: 204,
    body: '',
  }
}

export const handler = middy(deleteTodoHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
