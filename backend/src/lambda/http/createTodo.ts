import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils';
import { create } from '../../businessLayer/todos';

const logger = createLogger("create-todo");

export const createTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info("processing create todo request");
  const todoRequest: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);

  const newTodo = await create(todoRequest, userId);
  logger.info(`added todo ${newTodo}`);
  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newTodo,
    })
  }
}

export const handler = middy(createTodoHandler);
handler
  .use(httpErrorHandler())
  .use(cors({
    origin: "http://localhost:3000"
  }));
