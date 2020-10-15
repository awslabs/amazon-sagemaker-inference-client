const AWS = require('aws-sdk');
const fsp = require("promise-fs");

function sagemakerController() {

  async function postInference(req, res) {

    let response = {};

    try {

      let body = req.body;
      let endpoint = body.endpoint;
      let region = body.region;
      let imageBase64 = body.imageBase64;

      //================================================
      // Validate the user inputs:
      // Test an image was provided in call.
      if (imageBase64 === undefined || imageBase64.length < 1) {
        throw new Error('No Image data was provided in inference call.');
      };

      // Test an Endpoint was entered.
      if (endpoint === undefined || endpoint.length < 1) {
        throw new Error('No Sagemaker Inference Endpoint was provided.');
      } else {
        // remove any spaces that can happen from copy and paste
        endpoint = endpoint.replace(/ /g, '');
      };

      // Test if an AWS Region was entered.
      if (region === undefined || region.length < 1) {
        throw new Error('No AWS Region was provided.');
      };

      //================================================
      // Convert base64 image to file (blob) for sagemaker.

      // Get the MIME type of the base64 image received
      let mimeType = imageBase64.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

      // Pop the base64 image data to local variable.
      let imageData = imageBase64.split(';base64,').pop();

      // Write to local file as image
      await fsp.writeFile('/tmp/image', imageData, { encoding: 'base64' });

      // Get the file handle. 
      let imageFile = await fsp.readFile('/tmp/image');

      // Init the AWS client. 
      var sageMakerRuntime = new AWS.SageMakerRuntime({
        apiVersion: '2017-05-13',
        region: region
      });

      // Create the param to send to Sagemaker.
      var params = {
        Body: imageFile,
        EndpointName: endpoint,
        Accept: 'application/json',
        ContentType: mimeType
      };

      // Send the image to Sagemaker endpoint for inference and parse result.
      let data = await sageMakerRuntime.invokeEndpoint(params).promise();
      let result = String.fromCharCode.apply(null, data.Body);
      let predictions = JSON.parse(result).prediction;

      // Build the success response object with inference predictions.
      response.status = 'success';
      response.statusCode = 200;
      response.predictions = predictions;

    } catch (err) {
      response.status = 'error';
      response.statusCode = 500;
      response.error_message = err.message;
      response.error_trace = err.stack;
      console.log(response);

    } finally {
      res.json(response);
    }
  }

  async function postEndpoints(req, res) {

    let response = {};

    try {

      let body = req.body;
      let region = body.region;

      //================================================
      // Validate the user inputs:

      // Test if an AWS Region was entered.
      if (region === undefined || region.length < 1) {
        throw new Error('No AWS Region was provided.');
      };

      // Init the AWS client. 
      var sagemaker = new AWS.SageMaker({
        apiVersion:  '2017-07-24',
        region: region
      });

      // Create the param to send to Sagemaker.
      var params = {
        SortBy: "Name",
        SortOrder: "Descending",
        StatusEquals: "InService"
      };
      
      // Send the image to Sagemaker endpoint for inference and parse result.
      let data = await sagemaker.listEndpoints(params).promise();
      console.log(data);
      //let result = String.fromCharCode.apply(null, data.Body);
      //let endpoints = JSON.parse(data);
      let endpoints = data.Endpoints;

      // Build the success response object with inference predictions.
      response.status = 'success';
      response.statusCode = 200;
      response.result = endpoints;

    } catch (err) {
      response.status = 'error';
      response.statusCode = 500;
      response.error_message = err.message;
      response.error_trace = err.stack;
      console.log(response);

    } finally {
      res.json(response);
    }
  }

  return { postInference, postEndpoints };
}

module.exports = sagemakerController;
