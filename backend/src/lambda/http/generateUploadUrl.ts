import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import { createLogger } from '../../utils/logger'
import { TodoItem } from '../../models/TodoItem';
import {getUserId} from '../utils';

const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({
  signatureVersion: 'v4'
});
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX;
const bucketName = process.env.ATTACHMENTS_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const logger = createLogger("upload");

export const generateUploadUrlHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`generate upload url for ${todoId}`)
  const todo = await loadTodo(todoId);
  if (!todo) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'todo not found'
      })
    }
  }
  const userId = getUserId(event);
  if (todo.userId !== userId) {
    logger.info(`user ${userId} is not allowed to add attachment to todo created by ${todo.userId}`);
    return {
      statusCode: 403,
      body: '',
    }
  }

  const attachmentId = uuid.v4();
  logger.info(`updating todo with attachment url for ${attachmentId}`)
  await docClient.update({
    TableName: todosTable,
    Key: {
      "userId": todo.userId,
      "createdAt": todo.createdAt,
    },
    UpdateExpression: "SET attachmentUrl = :attachmentUrl",
    ExpressionAttributeValues: {
      ":attachmentUrl": `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
    },
    ReturnValues: "NONE"
  }).promise();

  logger.info(`creating signed URL`);
  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: attachmentId,
    Expires: urlExpiration
  });

  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl
    })
  }
}

async function loadTodo(todoId: string): Promise<TodoItem> {
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: todosIdIndex,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId
    }
  }).promise();
  if (result.Count === 0) {
    return undefined;
  }
  return result.Items[0] as TodoItem;
}

export const handler = middy(generateUploadUrlHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
