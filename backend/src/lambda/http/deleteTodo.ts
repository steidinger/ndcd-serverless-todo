import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils';
import { deleteTodo } from '../../businessLayer/todos';

const logger = createLogger("delete-todo");


export const deleteTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`Processing delete event for ID ${todoId}`);
  const userId = getUserId(event);

  await deleteTodo(todoId, userId);

  return {
    statusCode: 204,
    body: '',
  }
}

export const handler = middy(deleteTodoHandler);
handler
  .use(httpErrorHandler())
  .use(cors({
    origin: "http://localhost:3000"
  }));
