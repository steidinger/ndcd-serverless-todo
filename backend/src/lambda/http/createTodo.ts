import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import {TodoItem} from '../../models/TodoItem';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger("create-todo");


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info("processing create todo request");
  const parsed: CreateTodoRequest = JSON.parse(event.body)

  const newTodo: TodoItem = {
    ...parsed,
    todoId: uuid.v4(),
    userId: 'frank', // todo: use real user id
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
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newTodo,
    })
  }
}
