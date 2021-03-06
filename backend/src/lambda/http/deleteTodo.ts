import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {loadTodo, deleteTodo} from '../../dataLayer/TodoAccess';

const logger = createLogger("delete-todo");


export const deleteTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`Processing delete event for ID ${todoId}`);
  const userId = getUserId(event);
  const todo = await loadTodo(todoId);

  if (!todo) {
    logger.info(`todo with ID ${todoId} not found`);
    return {
      statusCode: 404,
      body: ''
    }
  }

  if (todo.userId !== userId) {
    logger.info(`user ${userId} is not allowed to delete todo created by ${todo.userId}`);
    return {
      statusCode: 403,
      body: '',
    }
  }
  logger.info(`deleting todo with ID ${todoId}, userId ${todo.userId}, createdAt ${todo.createdAt}`);
  await deleteTodo(todo);
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
