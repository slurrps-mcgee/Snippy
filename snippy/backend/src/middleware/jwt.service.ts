const express = require('express');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
import dotenv from 'dotenv';

dotenv.config();

// Replace with your Auth0 domain and audience
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
  tokenSigningAlg: 'RS256'
});

export default jwtCheck;