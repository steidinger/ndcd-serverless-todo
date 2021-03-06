import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {getUserId} from '../utils';
import {updateTodo} from '../../businessLayer/todos';

const logger = createLogger("update-todos");

export const updateTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const update: UpdateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);
  logger.info(`Processing update event for ID ${todoId}: ${JSON.stringify(update)}`);
  const updated = await updateTodo(todoId, update, userId);
  logger.info('Update complete');
  return {
    statusCode: 200,
    body: JSON.stringify(updated)
  }
}

export const handler = middy(updateTodoHandler);
handler
  .use(httpErrorHandler())
  .use(cors({
    origin: "http://localhost:3000"
  }));
