
const ip = require('ip');

function apiHealthController() {
  const serverIp = ip.address();

  function getHealth(req, res) {
    // API Alivness test response with status and server IP in return body.
    const apiResponse = {};
    apiResponse.status = 'successful';
    apiResponse.internalIp = serverIp;
    res.json(apiResponse);
  }

  return {
    getHealth
  };
}

module.exports = apiHealthController;
