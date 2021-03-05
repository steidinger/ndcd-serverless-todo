import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import {TodoItem} from '../../models/TodoItem';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
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
  
  await docClient.put({
    TableName: todosTable,
    Item: newTodo,
  }).promise();

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
