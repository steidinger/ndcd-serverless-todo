import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as uuid from 'uuid'
import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {loadTodo, setAttachmentUrl} from '../../dataLayer/TodoAccess';
import {getAttachmentUrl, getUploadUrl} from '../../dataLayer/AttachmentAccess';


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
  const attachmentUrl = getAttachmentUrl(attachmentId);
  logger.info(`updating todo with attachment url for ${attachmentId}`)
  await setAttachmentUrl(todo, attachmentUrl);

  logger.info(`creating signed URL`);
  const uploadUrl = getUploadUrl(attachmentId);

  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl
    })
  }
}

export const handler = middy(generateUploadUrlHandler);
handler.use(cors({
  origin: "http://localhost:3000"
}));
