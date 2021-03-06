import * as AWS from 'aws-sdk'
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';

const docClient = new AWS.DynamoDB.DocumentClient();
const todosTable = process.env.TODOS_TABLE;
const todosIdIndex = process.env.TODOS_ID_INDEX;

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    const result = await docClient.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
    }).promise();
    return result.Items as TodoItem[];
}

export async function createTodo(todo: TodoItem): Promise<TodoItem> {
    await docClient.put({
        TableName: todosTable,
        Item: todo,
    }).promise();
    return todo;
}

export async function loadTodo(todoId: string): Promise<TodoItem> {
    const result = await docClient.query({
        TableName: todosTable,
        IndexName: todosIdIndex,
        KeyConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
            ':todoId': todoId
        }
    }).promise();

    if (result.Count === 0) {
        return null;
    }
    return result.Items[0] as TodoItem;
}

export async function deleteTodo(todo: TodoItem): Promise<void> {
    await docClient.delete({
        TableName: todosTable,
        Key: {
            userId: todo.userId,
            createdAt: todo.createdAt,
        }
    }).promise();
}

export async function updateTodo(todo: TodoItem, update: TodoUpdate): Promise<TodoItem> {
    const updateResult = await docClient.update({
        TableName: todosTable,
        Key: {
            userId: todo.userId,
            createdAt: todo.createdAt,
        },
        UpdateExpression: "SET #name = :name, dueDate = :dueDate, done = :done",
        ExpressionAttributeValues: {
            ":name": update.name,
            ":dueDate": update.dueDate,
            ":done": update.done,
        },
        ExpressionAttributeNames: {
            "#name": "name",
        },
        ReturnValues: "ALL_NEW"
    }).promise();
    const updated = updateResult.Attributes;
    return updated as TodoItem;
}

export async function setAttachmentUrl(todo: TodoItem, attachmentUrl: string): Promise<void> {
    await docClient.update({
        TableName: todosTable,
        Key: {
            "userId": todo.userId,
            "createdAt": todo.createdAt,
        },
        UpdateExpression: "SET attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": attachmentUrl,
        },
        ReturnValues: "NONE"
    }).promise();
}


