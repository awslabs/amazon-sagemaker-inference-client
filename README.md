# Amazon Sagemaker Inference Client Application.

A hosted instance of this application stack can be seen at: [aws-inference-client](https://dbxdefot548c.cloudfront.net/)

![Application Example Use Screen Shot](images/app-car-inference-client.png)

Amazon Sagemaker is a fully managed service that removes the heavy lifting from each step of the machine learning process to make it easier to develop and train high quality machine learning models. This is especially attractive to developers that want to incorporate machine learning outcomes onto their applications without having to build and managed every step of the process.

Once trained, the machine learning model needs to be hosted and exposed in a way that makes it accessible to client applications. A common way to do this is via an Amazon Sagemaker Endpoint which is an AWS service optimised to hosts machine learning models and presents an authenticated public interface that can be consumed by end user applications.

The application code presented in this repository consists of a native JavaScript web client and a NodeJS AWS Lambda and Amazon API Gateway configuration. This provides an end-to-end example of how to perform an object detection inference against an Amazon Sagemaker Endpoint. The web client in this example overlays visual bounding boxes and text output of a user provided image submitted against the Amazon Sagemaker Endpoint as displayed above.

You are free to deploy in any AWS region supporting all of the listed services but when first creating the hosting resources it can take a few of hours for DNS to propagate and your application to become available if not deployed in **US-EAST-1**. For this reason, we will deploy in **US-EAST-1** and encourage you to do the same.

## AWS Amplify.
In addition to the application stack, AWS Amplify is used to manage a highly opinionated, secure, scalable and cost optimised deployment of the AWS services described. In doing so, further removing the heavy lifting of managing cloud or physical infrastructure from the developer to host the application. Through this process and with just a few commands, we can deploy the full application stack ready to incorporate object detection inference from our web client. See [AWS Amplify](https://docs.amplify.aws/) for more detail.  

## Application Architecture.
The application architecture is shown in the following diagram:
![Application Stack Architecture](images/architecture.png)

While provided as a code example, this application has also proven to be a useful tool to quickly visualize and validate when developing and optimising Amazon Sagemaker object detection models. Being able to see the result of your object detection model in a simulation of a real client application encourages the developer to press on with the work of experimenting with machine learning model development.

## AWS Lambda Role-Based Permissions.
Amazon Sagemaker Endpoints present an authenticated interface to the Internet so it’s reasonable to ask why we need to route the inference request via the Amazon API Gateway and the AWS Lambda. The reason in this example is so we can use AWS IAM role-based permissions to allow the Lambda to invoke the Sagemaker Endpoint without the need for the end-user to authenticate themselves in the web client. In this case, an unauthenticated request is received by the Lambda which by virtue of the sagemaker:invokeEndpoint role-based permission is able to forward the request to the Sagemaker Endpoint. This architecture should be considered in secure environments. 

## AWS Command Line Interface (CLI)
The remaining sections will deploy the resources and architecture to host an Amazon Sagemaker Endpoint and the Inference Client Application using the AWS CLI. If not already configured, you will need to create the AWS CLI credentials and configuration file to allow CLI and programmatic access. Follow the procedure [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if required. Be sure to specify the region you intend to use during the process.

## Hosting an Object Detection Model Endpoint
The inference client web application submits images for inference against a Amazon Sagemaker Endpoint. Its assumed you have an Endpoint configured for this purpose. If not, follow the guide provided in the [Deploy An Sagemaker Endpoint](deploy-sagemaker-endpoint/) section.

For programmatic deployment of an Amazon Sagemaker Endpoint see this [public guide](https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_CreateEndpoint.html).

## Deploying the Inference Client Application.
Deploying the application stack described using AWS Amplify is just a few simple commands but does assume you have access to an AWS environment. 

The following procedure assumes you are on a supported Linux or MacOS device and have installed:
1. Node: v14.x or later
1. NPM: v6.14.4.x or later
1. Git: v2.23.0 or later

#### To deploy the application stack, follow the below steps.

**1. Clone the Amazon Sagemaker Inference Client Application GIT repository and 'cd' into the directory:**  
```
git clone https://github.com/aws-samples/amazon-sagemaker-inference-client.git
cd amazon-sagemaker-inference-client
```

**2. Install the application dependencies and build the project:**  
```
npm install
npm run build
```

**3. Install AWS Amplify CLI:**   
```
npm install -g @aws-amplify/cli@8.0.0
```

**4. Initialize AWS Amplify in this project:**  
```
amplify init
```

* Enter a name for the project: **awsamplifysagemaker**

* Accept the default options provide as below:
```
Project information
| Name: awsamplifysagemaker
| Environment: dev
| Default editor: Visual Studio Code (or other depending on environment)
| App type: javascript
| Javascript framework: none
| Source Directory Path: src
| Distribution Directory Path: dist
| Build Command: npm run-script build
| Start Command: npm run-script start
```

 Initialize the project with the above configuration? (Y/n): **Y**

* Select the authentication method you want to use? **AWS Profile**
* Please choose the profile you want to use: ***[Choose the profile you want for the desired AWS Account]***

**Note:** The selected profile will determine the region the application is deployed in. If not deployed in the US-EAST-1 region, it can take some time for DNS to propagate and make the site available. During this time, you will see a **AccessDenied** error when accessing the URL.

The AWS Amplify CLI will now initialise your AWS account with the required roles and other resources. This can take a few minutes.

**5. Using AWS Amplify, add S3 backed CloudFront public hosting:**  
```
amplify add hosting
```

Enter the following responses: 
* Select the plugin module to execute **Amazon CloudFront and S3**
* Select the environment setup: **PROD (S3 with CloudFront using HTTPS)**
* hosting bucket name: **[Enter to accept the default or enter a unique bucket name.]**

**6. Using AWS Amplify, create the backend API Gateway and serverless function:**  
```
amplify add api
```
Enter the following responses:  
**Note:** *Some of the text responses given below are referenced in the source code and so must be copied exactly.*

* Please select from one of the below mentioned services: **REST**
* Provide a friendly name for your resource to be used as a label for this category in the project: **smInferenceClient**
* Provide a path (e.g., /items) **/api/v1/sagemaker**
* Provide the AWS Lambda function name: **awsamplifysagemaker**
* Choose the function runtime that you want to use: **NodeJS**
* Choose the function template that you want to use: **Serverless ExpressJS function (Integration with API Gateway)**
* Do you want to configure advanced settings? (y/N) **N**
* Do you want to edit the local lambda function now? (Y/n) **n**  
Successfully added the Lambda function locally  

* Restrict API access? (Y/n) **n**
* Do you want to add another path? (y/N) **N**

**Successfully added resource smInferenceClient locally.**

**7. Copy the AWS Lambda code to local AWS Amplify backend function:**  
In the previous step, AWS Amplify defined a skeleton Lambda function with placeholders for the function handler. The below command overwrites this with the Sagemaker Inference client backend source code developed for this project: 
```
cp -rf lambda-function/src/ amplify/backend/function/awsamplifysagemaker/src/
```

**8. Update AWS Amplify generated Lambda role-based policy to add InvokeEndpoint:**  
In the previous step, AWS Amplify created an AWS CloudFormation template to deploy the AWS Lambda function including the role-based permissions. The below command overwrites this template to also include an additional policy to give the Lambda sagemaker:InvokeEndpoint permissions. 
```
cp lambda-function/src/awsamplifysagemaker-cloudformation-template.json amplify/backend/function/awsamplifysagemaker/awsamplifysagemaker-cloudformation-template.json
```

**9. Push the application stack and publish the client-side code:**  

The above commands configured the automation scripts to deploy an optimised hosting stack but AWS Amplify only saved these locally in the **amplify** directory that was created with the ```amplify init``` command.

This concept of local and remote configuration is key to AWS Amplify. You can see the current status of the configured service as below:
```
amplify status
```

Current Environment: dev
    
┌──────────┬─────────────────────┬───────────┬───────────────────┐
│ Category │ Resource name       │ Operation │ Provider plugin   │
├──────────┼─────────────────────┼───────────┼───────────────────┤
│ Hosting  │ S3AndCloudFront     │ Create    │ awscloudformation │
├──────────┼─────────────────────┼───────────┼───────────────────┤
│ Function │ awsamplifysagemaker │ Create    │ awscloudformation │
├──────────┼─────────────────────┼───────────┼───────────────────┤
│ Api      │ smInferenceClient   │ Create    │ awscloudformation │
└──────────┴─────────────────────┴───────────┴───────────────────┘

AWS Amplify has two commands to push the local config:
1. **amplify push:** Will push the automation scripts for any services that are not in sync.
2. **amplify publish:** Will perform an **amplify push** then also upload the content of the **dist** folder.

In this case because we want to create the environment and also upload the client application so we will choose to publish:
```
amplify publish
```

Confirm the update when asked:  
? Are you sure you want to continue? (Y/n): **Y**

At the completion of this command, you will be given the URL the application is hosted at such as:
```
Your app is published successfully.
https://aaaabbbbcccc.cloudfront.net
```

Record this URL.

**Note:** This command can take some time. It will create an S3 bucket with a secure CloudFront distribution to publicly host the client-side application. For the backend, AWS Amplify will create and deploy the Lambda and create an Amazon API gateway and configure the required integrations between the them. 

## Updating the hosting environment or application code
If in the future you choose to update the hosting environment with any of the many additional features of AWS Amplify such as Analytics, Notifications, PubSubs or Storage all you need to do is then apply the ```amplify push`` command. This will update the hosted services without updating the application front end content.

If you update the application front end code and want to synchronized that and the hosted environment apply the ```amplify publish``` command. 

A quick tip, if as in this case you are hosting the content via an Amazon CloudFront distribution, then include the ‘-c’ switch to force an invalidation of the CDN cache to ensure your new content is presented to the Internet such as: ```amplify publish -c```

## Accessing the Web Application.
On completion of the above sections, the web client will be hosted at an Amazon CloudFront URL that was shown in the previous output. If you missed it just enter `amplify status` and look for the CloudFront distribution URL again.

**Open the Amazon CloudFront URL in a browser and enter into the UI:**  
1. **Region:** The AWS region the Endpoint is hosted,
1. **Endpoint name:** The Amazon Sagemaker Endpoint to send the image for inference. 
  * This list will be auto populated from the active Sagemaker Endpoints in the selected region. 
1. **Inference Labels:** Add the inference labels / classes that the model was trained on, these are just for display. 
  * In the example model add four classes: **car, van, ute, truck**  
1. Select an image to send for inference by clicking the **Browse** button and
1. Click **Submit** to send the image for inference against the Amazon Sagemaker Endpoint.

We selected an image consisting of a busy traffic scene that was not in the training image dataset and got the below result:

![Application Example Use Screen Shot](images/app-car-inference-client.png)

As you can see, the client application was able to process the Image and update the response of the Amazon Sagemaker Endpoint inference. 

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
