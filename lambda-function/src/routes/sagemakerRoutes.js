
const express = require('express');
const sagemakerController = require('../controllers/sagemakerController');

const apiv1Router = express.Router();
const { postEndpoints, postInference } = sagemakerController();

function router() {
  apiv1Router.route('/inference').post(postInference);
  apiv1Router.route('/endpoints').post(postEndpoints);

  return apiv1Router;
}

module.exports = router;
