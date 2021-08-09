var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// Keeping this file and is minimum output to not anger Amplify. Not needed, everything on index.js
var app = express()


module.exports = app
