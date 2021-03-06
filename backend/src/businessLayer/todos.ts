import * as uuid from 'uuid'
import * as createError from 'http-errors';

import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as TodoAccess from '../dataLayer/TodoAccess';
import {getAttachmentUrl, getUploadUrl} from '../dataLayer/AttachmentAccess';

const logger = createLogger("business-layer");

export async function create(todo: CreateTodoRequest, userId: string): Promise<TodoItem> {
    const newTodo: TodoItem = {
        ...todo,
        todoId: uuid.v4(),
        userId: userId,
        createdAt: new Date().toISOString(),
        done: false,
    }

    logger.info(`adding todo ${JSON.stringify(newTodo)}`)
    return TodoAccess.createTodo(newTodo);
}

export async function deleteTodo(todoId: string, userId: string): Promise<void> {
    const todo = await TodoAccess.loadTodo(todoId);
    if (!todo) {
      logger.info(`todo with ID ${todoId} not found`);
      throw new createError.NotFound(`todo with ID ${todoId} not found`);
    }
  
    if (todo.userId !== userId) {
      logger.info(`user ${userId} is not allowed to delete todo created by ${todo.userId}`);
      throw new createError.Forbidden();
    }
    logger.info(`deleting todo with ID ${todoId}, userId ${todo.userId}, createdAt ${todo.createdAt}`);
    await TodoAccess.deleteTodo(todo);
    logger.info('deleted todo');  
    return null;
}

export async function addAttachment(todoId: string, userId: string): Promise<string> {
    const todo = await TodoAccess.loadTodo(todoId);
    if (!todo) {
        throw new createError.NotFound(`todo with ID ${todoId} not found`);
    }
    if (todo.userId !== userId) {
      logger.info(`user ${userId} is not allowed to add attachment to todo created by ${todo.userId}`);
      throw new createError.Forbidden(`user ${userId} is not allowed to add attachment to todo created by ${todo.userId}`);
    }
  
    const attachmentId = uuid.v4();
    const attachmentUrl = getAttachmentUrl(attachmentId);
    logger.info(`updating todo with attachment url for ${attachmentId}`)
    await TodoAccess.setAttachmentUrl(todo, attachmentUrl);
 
    logger.info(`creating signed URL`);
    return getUploadUrl(attachmentId);
}

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    return TodoAccess.getAllTodos(userId);
}

export async function updateTodo(todoId: string, update: UpdateTodoRequest, userId: string) {
    const todo = await TodoAccess.loadTodo(todoId);
    if (!todo) {
      logger.info(`todo with ID ${todoId} not found`);
      throw new createError.NotFound(`todo with ID ${todoId} not found`);
    }
  
    if (todo.userId !== userId) {
      logger.info(`user ${userId} is not allowed to update todo created by ${todo.userId}`);
      throw new createError.Forbidden(`user ${userId} is not allowed to update todo created by ${todo.userId}`);
    }
    logger.info('Updating todo');
    return TodoAccess.updateTodo(todo, update);
}