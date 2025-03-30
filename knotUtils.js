const axios = require('axios');

const KNOT_API_URL = 'https://development.knotapi.com/api/v2';

function getKnotClient() {
  return axios.create({
    baseURL: KNOT_API_URL,
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_KNOT_API_KEY}`,
      'Content-Type': 'application/json',
      'Knot-Client-Id': process.env.REACT_APP_KNOT_CLIENT_ID,
      'Knot-Secret': process.env.REACT_APP_KNOT_SECRET,
      'Accept': 'application/json',
      'Knot-API-Version': '2023-12-01'
    }
  });
}

module.exports = {
  getKnotClient,
  KNOT_API_URL
}; 