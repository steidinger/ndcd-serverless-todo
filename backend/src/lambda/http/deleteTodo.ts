import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX;
const logger = createLogger("delete-todo");

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`Processing delete event for ID ${todoId}`);

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
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    }
  }
  const todo = result.Items[0];
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
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: '',
  }
}
