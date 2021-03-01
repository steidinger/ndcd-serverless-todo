import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {TodoItem} from '../../models/TodoItem';

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX;
const logger = createLogger("update-todos");


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(`Processing update event for ID ${todoId}: ${JSON.stringify(updatedTodo)}`);

  const result = await docClient.query({
    TableName: todosTable,
    IndexName: todosIdIndex,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId
    }
  }).promise()

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

  const todo = result.Items[0] as TodoItem;
  todo.name = updatedTodo.name;
  todo.dueDate = updatedTodo.dueDate;
  todo.done = updatedTodo.done;
  logger.info('Updating todo');

  await docClient.put({
    TableName: todosTable,
    Item: todo,
  }).promise();

  logger.info('Update complete');
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(todo)
  }
}
