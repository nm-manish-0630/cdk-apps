import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import path from 'path';

export class SNSSQSLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.TableV2(this, 'Table', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });


        const snsTopic = new sns.Topic(this, 'Topic', {
            displayName: 'New subscription topic',
            topicName: 'new-subscription-topic'
        });

        const myFunctionPublisher = new lambda.Function(this, "PublisherFunction", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "publisher.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda/publisher')),
            onSuccess: new destinations.SnsDestination(snsTopic),
            environment: {
                SNS_TOPIC_ARN: snsTopic.topicArn
            }
        });

        snsTopic.grantPublish(myFunctionPublisher);

        const myFunctionProcessor = new lambda.Function(this, "SubscriberFunction", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "subscriber.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda/subscriber')),
            environment: {
                TABLE_NAME: table.tableName
            }
        });

        table.grantReadWriteData(myFunctionProcessor);


        const newSqs = new sqs.Queue(this, 'NewSQSQueue');
        snsTopic.addSubscription(new sns_subscriptions.SqsSubscription(newSqs));

        myFunctionProcessor.addEventSource(new SqsEventSource(newSqs));

        // Define the Lambda function URL resource
        const myFunctionUrl = myFunctionPublisher.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
        });

        // Define a CloudFormation output for your URL
        new cdk.CfnOutput(this, "myFunctionUrlOutput", {
            value: myFunctionUrl.url,
        })

    }
}