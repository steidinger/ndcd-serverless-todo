import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import * as uuid from 'uuid'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import {TodoItem} from '../../models/TodoItem';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {createTodo} from '../../dataLayer/TodoAccess';

const logger = createLogger("create-todo");

export const createTodoHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info("processing create todo request");
  const parsed: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);

  const newTodo: TodoItem = {
    ...parsed,
    todoId: uuid.v4(),
    userId: userId,
    createdAt: new Date().toISOString(),
    done: false,
  }

  logger.info(`adding todo ${JSON.stringify(newTodo)}`)
  await createTodo(newTodo);

  logger.info('added todo');
  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newTodo,
    })
  }
}

export const handler = middy(createTodoHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
