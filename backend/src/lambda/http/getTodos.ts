import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {getAllTodos} from '../../dataLayer/TodoAccess';

const logger = createLogger("get-todos");

const getTodosHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('processing event ' + JSON.stringify(event));
  const userId = getUserId(event);
  const todos = await getAllTodos(userId);
  return {
    statusCode: 200,
    body: JSON.stringify({items: todos}),
  }
}

export const handler = middy(getTodosHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
