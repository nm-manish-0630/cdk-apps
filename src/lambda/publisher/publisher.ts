import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient();

export const handler = async (event: any) => {
    console.log('Publisher received event:', event);

    const topicArn = process.env.SNS_TOPIC_ARN;

    try {
        const result = await snsClient.send(
            new PublishCommand({
                TopicArn: topicArn,
                Message: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    data: event
                })
            })
        );
        console.log('Message published to SNS:', result.MessageId);
        return {
            statusCode: 200,
            date: new Date().toISOString(),
            message: 'Event published successfully',
            messageId: result.MessageId
        };
    } catch (error) {
        console.error('Error publishing to SNS:', error);
        throw error;
    }
};

