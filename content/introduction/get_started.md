## GET STARTED

### Initialize CDK app

Firstly, create a new project folder. I’m using a mac, so i’ll create a folder called `acms` and cd into it

`mkdir acms`

`cd acms`

Next, initialize a CDK typescript application in your newly created folder.

`cdk init --language typescript`

Once created, open up the CDK app in your favorite IDE.

### Dependencies

Add these dependencies to the `package.json` file in the cdk project. 

```jsx
"@aws-lambda-powertools/logger": "^0.9.1",
"@aws-lambda-powertools/tracer": "^0.9.1",
"@types/aws-lambda": "^8.10.101",
"aws-sdk": "^2.1153.0",
"ksuid": "^2.0.0",
```

We’ll be using the `lambda-powertools` typescript library for logging and tracing. 

Feel free to read more about the library here [https://awslabs.github.io/aws-lambda-powertools-typescript/latest/](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)

`ksuid` stands for K-Sortable Unique Identifier. Its an efficient, comprehensive, battle-tested Go library for generating and parsing a specific kind of globally unique identifier called a *KSUID.*

Learn more about the library here [https://github.com/segmentio/ksuid](https://github.com/segmentio/ksuid)
