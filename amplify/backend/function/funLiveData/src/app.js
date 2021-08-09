/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "liveData";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = true; // TODO: update in case is required to use that definition
const partitionKeyName = "streamId";
const partitionKeyType = "S";
const sortKeyName = "id";
const sortKeyType = "N";
const hasSortKey = sortKeyName !== "";
const path = "/livedata";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


var authData = { userId: '', userName: '', groupName: '' };

var scanResult = [];

var gLastKey = '';
var sDate;
var eDate;


function loadAuthData(req) {

  console.log('CHECK AUTH', req.apiGateway.event.requestContext);

  try {
    authData.userId = req.apiGateway.event.requestContext.authorizer.claims.sub
  } catch (err){}

  try {
    authData.userName = req.apiGateway.event.requestContext.authorizer.claims.userName
  } catch (err){}

  if (!authData.userName || authData.userName == '') {

    try {
      authData.userName = req.apiGateway.event.requestContext.authorizer.claims['cognito:username']
    } catch (err){}
  }

  try {
    authData.groupName = req.apiGateway.event.requestContext.authorizer.claims.profile
  } catch (err){}
}


app.put(path + '/heartbeat', function(req, res) {
  
  loadAuthData(req);

  //let authval;

  let uid = new Date().getTime();
  let uidErr = '';

  try {

    //authval = req.apiGateway.event.requestContext.authorizer.claims.sub;

    //let authGrupo = req.apiGateway.event.requestContext.authorizer.claims['profile'];
    
    //let agreementInfo = req.apiGateway.event.requestContext.authorizer.claims['zoneinfo'];

    let authGrupo = authData.groupName;

    if (!authGrupo || authGrupo == '') authGrupo = 'sephora-0804';

    try {

      let companyUserId = '';
      let companyUserName = '';
      
      let streamUrl, streamWhats;

      streamUrl = '';
      streamWhats = '';

      try {
        
        companyUserId = req.apiGateway.event.requestContext.authorizer.claims['cognito:username'];

      } catch(errCog){ }
      
      try {

        companyUserName = req.apiGateway.event.requestContext.authorizer.claims['name'];

      } catch(errCog){ }

      let putItemParams = {
        TableName: tableName,
        Item: {
          id: uid,
          userId: authData.userId,
          companyId: 'sephora',
          companyUserId: authData.userId,
          companyUserName: authData.userName,
          streamId: 'cluster-digital',
          eventDate: new Date().toISOString()
        } 
      }

      dynamodb.put(putItemParams, (err, data) => {

        if (err) {

          res.statusCode = 500;
          res.json({error: err, url: req.url, body: req.body});

        } else{

          res.json({
            success: true,
            streamUrl: streamUrl,
            id: uid,
            streamName: 'Sephora',
            streamWhats: streamWhats,
            agreementInfo: '',
            requiresAgreement: false,
            agreementUrl: '',
            url: req.url,
            data: data,
            uidErr: uidErr
          });
        }
      });
      
    } catch(errDyn) {

      res.json({error: errDyn, table: tableName, uidErr: uidErr });
    }

      
  } catch(err) {

    authval = 'Error: ' + err;

    res.json({error: authval });
  }
  

});



app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
