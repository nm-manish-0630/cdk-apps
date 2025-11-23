import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
    console.log("Subscriber received message:", event);
    const item = {
        id: new Date().toISOString(),
        message: "Hello DynamoDB from Lambda!",
        timestamp: Date.now()
    };

    const response = await ddb.send(
        new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: item
        })
    );

    return { insertStatusCode: response.$metadata.httpStatusCode, message: "Item inserted successfully" };
};

