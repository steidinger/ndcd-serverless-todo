import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import {getUserId} from '../utils';
import {getAllTodos} from '../../businessLayer/todos';

const getTodosHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);
  const todos = await getAllTodos(userId);
  return {
    statusCode: 200,
    body: JSON.stringify({items: todos}),
  }
}

export const handler = middy(getTodosHandler);
handler
  .use(httpErrorHandler())
  .use(cors({
    origin: "http://localhost:3000"
  }));
