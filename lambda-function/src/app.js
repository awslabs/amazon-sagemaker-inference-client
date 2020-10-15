/* 
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
*/

var express = require('express');
var bodyParser = require('body-parser');
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

// Local routers.
const apiHealthRouter = require('./routes/apiHealthRoutes');
const sagemakerRouter = require('./routes/sagemakerRoutes');

// declare a new express app
var app = express()
// Extend bodyparser max payload size to allow base64 images in payload.
//app.use(bodyParser.json())
app.use(bodyParser.json({limit: '25mb', extended: true}))
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

/*********************************
* Local routes                    *
**********************************/
app.use('/api/v1/sagemaker', sagemakerRouter());
app.use('/api/v1/sagemaker/*', sagemakerRouter());

/*********************************
* Start the App server           *
**********************************/

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
