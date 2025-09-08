const express = require('express');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');

// Replace with your Auth0 domain and audience
const jwtCheck = auth({
  audience: 'http://localhost:3000',
  issuerBaseURL: 'https://dev-4ev7py4uqxc7prli.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

export default jwtCheck;
