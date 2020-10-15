
const express = require('express');
const apiHealthController = require('../controllers/apiHealthController');

const apiv1Router = express.Router();
const { getHealth } = apiHealthController();

function router() {
  // Application root / index routes
  apiv1Router.route('/health').get(getHealth);

  return apiv1Router;
}

module.exports = router;
