
// Import the AWS Amplify modules used in this project:
import Amplify from '@aws-amplify/core';
import API from '@aws-amplify/api';
import awsconfig from '../aws-exports';

// Configure AWS Amplify using defined confg file.
Amplify.configure(awsconfig);

// AWS Amplify Parameters.
// This must be the AWS Amplify name given to the API object.
// This is used from the client hosting to access the URL given to the API Gateway deployed by AWS Amplify.
let apiName = 'smInferenceClient';

// This must be the path you have configured on your API in AWS Amplify
let apiPath = '/api/v1/sagemaker';
let inferenceApiPath = apiPath + '/inference';
let endpointApiPath = apiPath + '/endpoints';

//===============================================
// Get DOM objects
let imgTarget = document.getElementById("inference-image-display");
let imageFileLabel = document.getElementById("image-file-label");
let imageFileSelect = document.getElementById("image-file-select");
imageFileSelect.addEventListener('change', imageSelected, false);

let endpointNameSelect = document.getElementById("endpoint-name-select");
let submit = document.getElementById("submit-inference");
submit.addEventListener('click', submitInference, false);

let inferenceText = document.getElementById("inference-text");
let thresholdSlider = document.getElementById("threshold-range");
thresholdSlider.addEventListener('change', thresholdUpdate, false);

let thresholdLabel = document.getElementById("threshold-range-label");
let regionSelect = document.getElementById("region-select");
regionSelect.addEventListener('change', setSagemakerEndpoints, false);

let butAClassInput = document.getElementById("add-class-input");
butAClassInput.addEventListener('click', addClassInput, false);

let butRemoveClassInput = document.getElementById("remove-class-input");
butRemoveClassInput.addEventListener('click', removeClassInput, false);

// Var to save submitted inference image before scaling and processing.
let originalImage = new Image();

let predictions = [];
let classCnt = 0;
let classMap = [];

let colorArray = ['red', 'green', 'blue', 'orange', 'pink', 'yellow', 'purple', 'cyan', 'Chartreuse'];

//===============================================
// Image Related Functions
/**
 * Updates the img display when user selects a test image.
 */
function imageSelected() {

  var fr = new FileReader();
  // when image is loaded, set the src of the image tag
  fr.onload = function (e) {

    // Save submitted inference image into a local var to be sent for inference in original state 
    // before scaling and drawing of bounding boxes. 
    originalImage.src = this.result;

    // Display the submitted image in the UI
    imgTarget.src = originalImage.src;

    // Update the HTML labels with new image
    imageFileLabel.innerHTML = imageFileSelect.files[0].name;
    inferenceText.innerHTML = `Image Selected: ${imageFileSelect.files[0].name}`;

    // Reset any previous predictions
    predictions = [];
  };

  // fill fr with image data    
  fr.readAsDataURL(imageFileSelect.files[0]);
}

//===============================================
// Sagemaker functions.
/**
 * Validates user inputs and sends the inference request to Sagemaker endpoint
 */
async function submitInference() {

  try {
    //================================================
    // Validate the user inputs:
    validateUserInputs();

    //================================================
    // Remove any spaces from the endpointNameSelect that can happen from copy and paste.
    let epName = endpointNameSelect.value.replace(/ /g, '');

    // Update the text output div
    inferenceText.innerHTML = `Image Selected: ${imageFileSelect.files[0].name}<br />`;
    inferenceText.innerHTML += `Sagemaker Endpoint: ${epName}<br />`;

    // Get the inference classes the user entered into a list.
    classMap = [];
    for (let i = 0; i <= classCnt; i++) {
      classMap[i] = $(`#inference-class-${i}`).val();
    }
    inferenceText.innerHTML += `Inference Classes: ${JSON.stringify(classMap)}<br />`;

    inferenceText.innerHTML += `Sending the image for inference to the Sagemaker Endpoint......<br />`;

    // Post the request
    // TODO: If image source is very large can cause long delay, add option to scale image down before POST'ing
    let apiInit = {
      body: {
        endpoint: epName,
        region: regionSelect.value,
        imageBase64: originalImage.src
      }
      // headers: {} // OPTIONAL
    }
    let response = await API.post(apiName, inferenceApiPath, apiInit);

    if (!response.statusCode) {
      throw Error("An unknown error occured")
    } else if (response.statusCode !== 200) {
      throw Error(response.error_message);
    }

    // if no error, get the predictions and process.
    predictions = response.predictions;

    // Makes prediction vaues more readable and display to UI
    inferenceText.innerHTML += getPredictionHtmlPrettyPrint();
    applyPredictionsToImage();

  } catch (err) {
    inferenceText.innerHTML += `ERROR: An error occured:<br />${err}`;
    console.log(err, err.stack);
  }
}

async function setSagemakerEndpoints() {

  try {
    // Post the request
    let apiInit = {
      body : {
      region: regionSelect.value
      }
    }
    let response = await API.post(apiName, endpointApiPath, apiInit);

    if (!response.statusCode) {
      throw Error("An unknown error occured")
    } else if (response.statusCode !== 200) {
      throw Error(response.error_message);
    }

    let endpoints = response.result;
    var options = endpoints.map(function (endpoint) {
      let epName = endpoint.EndpointName;
      return `<option value=${epName}>${epName}</option>`
    });

    endpointNameSelect.innerHTML = options;

  } catch (err) {
    inferenceText.innerHTML += `ERROR: An error occurred retrieving the selected regions Sagemaker Endpoints:<br />${err}`;
    console.log(err, err.stack);
  }
}

function validateUserInputs() {

  // Test user has selected an image
  if (imageFileSelect.files[0] === undefined) {
    throw Error('No image has been selected.');
  };

  // Test an Endpoint was entered.
  if (endpointNameSelect.value === undefined || endpointNameSelect.value.length < 1) {
    throw Error('No Sagemaker Inference Endpoint has been entered.');
  };
}

// Takes Amazon Sagemaker inference endpoint predictions and updates bounding boxed to imgTarget
function applyPredictionsToImage() {

  let threshold = (thresholdSlider.value / 100);
  let width = imgTarget.width;
  let height = imgTarget.height;

  // Create the trace canvas to draw on image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(originalImage, 0, 0, width, height);
  ctx.lineWidth = 2;
  ctx.font = "15px Arial";

  ctx.beginPath();
  let x1, x2, y1, y2;
  let labelText, classVal, confidence, color;
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i][1] > threshold) {

      classVal = predictions[i][0];
      color = colorArray[predictions[i][0]];

      // Set color as per class label index of colorArray and 
      ctx.strokeStyle = color;

      // Get X/Y points from prediction.
      x1 = predictions[i][2] * width;
      y1 = predictions[i][3] * height;
      x2 = (predictions[i][4] * width) - x1;
      y2 = (predictions[i][5] * height) - y1;

      // Draw the box for detections.
      ctx.rect(x1, y1, x2, y2);
      ctx.stroke();

      // Draw the label and confidence as text
      confidence = `${Math.round(predictions[i][1] * 10000) / 100} %`;
      labelText = `ID:${i + 1}-${getPredictionLabel(classVal)} - ${confidence}`;

      ctx.fillStyle = color;
      ctx.fillText(labelText, x1, y1 - 2);

    }
  }

  let url = canvas.toDataURL();
  imgTarget.src = url;
}

function thresholdUpdate() {
  let val = thresholdSlider.value;
  thresholdLabel.innerHTML = `Confidence Threshold: ${val}%`;
  if (predictions && predictions.length > 0) applyPredictionsToImage()
}

//===============================================
// Add / remove to Inference Class list inputs.
function addClassInput() {
  if (classCnt >= 9) {
    alert('Reached maximum supported inference classes');
    return;
  }

  classCnt = classCnt + 1;

  let classInput = [];
  classInput.push(`          <div class="row" id="inference-class-${classCnt}-row">\n`);
  classInput.push(`            <div class="col input-group input-group-sm mb-1">\n`);
  classInput.push(`              <div class="input-group-prepend">\n`);
  classInput.push(`                <span class="input-group-text" id="inference-class-${classCnt}-label">Class ${classCnt}:</span>\n`);
  classInput.push(`              </div>\n`);
  classInput.push(`              <input type="text" class="form-control" id="inference-class-${classCnt}" placeholder="Enter Inference Class ${classCnt}" aria-label="Inference Class ${classCnt}" aria-describedby="inference-class-${classCnt}-label">\n`);
  classInput.push(`            </div>\n`);
  classInput.push(`          </div>\n`);

  let html = classInput.join("");
  $(html).insertBefore($("#inference-class-add-remove"));
}

// Remove class list.
function removeClassInput() {
  if (classCnt < 0) {
    alert('No inference classes available for delete.');
    return;
  }
  if ($(`#inference-class-${classCnt}-row`).remove()) classCnt -= 1;

}

//===============================================
// Helper classes

// Take a prediction array in order: [label Index, confidence, xmin, ymin, xmax, ymax]
// and return human readable response
function getPredictionHtmlPrettyPrint() {

  // Loop through all element in predictions and round to 4 places.
  let response = [];
  let classVal, classLabel = "", confidence = "", color = "";
  for (let i = 0; i < predictions.length; i++) {

    // Set the class label as per Class Map if user entered a matching vakue
    classVal = parseInt(predictions[i][0]);

    // Prediction confidence as human readable %
    confidence = `${Math.round(predictions[i][1] * 10000) / 100} %`;

    // Get the prediction color to be dicplayed for this label
    color = colorArray[classVal];

    // Get the class label.
    classLabel = getPredictionLabel(classVal);

    // Now append to response
    response.push(`<p style="color: ${color}">${i + 1} - ${classLabel} - Confidence: ${confidence}</p>`);

  }

  return response.join("");
}

function getPredictionLabel(classVal) {

  // If a matching value in classMap the set as label - if not, return unknown-label
  let classLabel;
  if (classMap[classVal] && classMap[classVal].length >= 0) {
    classLabel = classMap[classVal];
  } else {
    classLabel = `label:${classVal}`;
  }

  return classLabel;
}

// Set initial threshold
thresholdUpdate();

setSagemakerEndpoints();
