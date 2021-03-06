import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {getUserId} from '../utils';
import {loadTodo, updateTodo} from '../../dataLayer/TodoAccess';

const logger = createLogger("update-todos");

export const updateTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(`Processing update event for ID ${todoId}: ${JSON.stringify(updatedTodo)}`);

  const todo = await loadTodo(todoId);
  if (!todo) {
    logger.info(`todo with ID ${todoId} not found`);
    return {
      statusCode: 404,
      body: ''
    }
  }

  const userId = getUserId(event);
  if (todo.userId !== userId) {
    logger.info(`user ${userId} is not allowed to update todo created by ${todo.userId}`);
    return {
      statusCode: 403,
      body: '',
    }
  }
  logger.info('Updating todo');
  const updated = await updateTodo(todo, updatedTodo);
  logger.info('Update complete');
  return {
    statusCode: 200,
    body: JSON.stringify(updated)
  }
}

export const handler = middy(updateTodoHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
